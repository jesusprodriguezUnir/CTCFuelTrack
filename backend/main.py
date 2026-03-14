import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from the root .env file
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(dotenv_path=os.path.join(root_dir, '.env'))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173")

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger("ctcfueltrack.backend")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env file at project root")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="CTCFuelTrack Bridge API")

allowed_origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class LoadRequest(BaseModel):
    codigo_surtidor: str
    codigo_maquina: str
    litros: float

@app.post("/api/surtidores/mock-load")
def mock_load_fuel(request: LoadRequest):
    """
    Mock endpoint to simulate receiving data from a physical fuel dispenser.
    """
    codigo_surtidor = request.codigo_surtidor.strip()
    codigo_maquina = request.codigo_maquina.strip()

    if not codigo_surtidor or not codigo_maquina:
        raise HTTPException(status_code=400, detail="Los códigos de surtidor y máquina son obligatorios")

    try:
        # 1. Verify that the surtidor exists and is active
        surtidor_response = supabase.table("surtidores_config").select("*").eq("codigo_surtidor", codigo_surtidor).execute()
        if not surtidor_response.data:
            raise HTTPException(status_code=404, detail="Surtidor no encontrado")

        surtidor = surtidor_response.data[0]
        if surtidor.get("estado") != "activo":
            raise HTTPException(status_code=400, detail="El surtidor no está activo")

        # 2. Verify that the maquina exists
        maquina_response = supabase.table("maquinaria").select("*").eq("codigo_interno", codigo_maquina).execute()
        if not maquina_response.data:
            raise HTTPException(status_code=404, detail="Máquina no encontrada")

        maquina = maquina_response.data[0]

        # 3. Check capacity logic
        capacidad = maquina.get("capacidad_deposito")
        if request.litros <= 0 or request.litros > capacidad:
            raise HTTPException(status_code=400, detail=f"Cantidad inválida. La capacidad máxima de la máquina es {capacidad}L.")

        # 4. Insert into registros_consumo
        registro_data = {
            "maquina_id": maquina["id"],
            "surtidor_id": surtidor["id"],
            "litros_repostados": request.litros,
            "tipo_registro": "automatico"
        }

        insert_response = supabase.table("registros_consumo").insert(registro_data).execute()
        if not insert_response.data:
            logger.error("Insert sin respuesta para registro automático", extra={"codigo_surtidor": codigo_surtidor, "codigo_maquina": codigo_maquina})
            raise HTTPException(status_code=500, detail="Error al registrar el consumo")

        logger.info("Carga automática registrada", extra={"codigo_surtidor": codigo_surtidor, "codigo_maquina": codigo_maquina, "litros": request.litros})
        return {
            "status": "success",
            "message": "Carga de combustible registrada exitosamente",
            "data": insert_response.data[0]
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error inesperado procesando carga automática")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
