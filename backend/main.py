import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from the root .env file
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(dotenv_path=os.path.join(root_dir, '.env'))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env file at project root")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="CTCFuelTrack Bridge API")

class LoadRequest(BaseModel):
    codigo_surtidor: str
    codigo_maquina: str
    litros: float

@app.post("/api/surtidores/mock-load")
def mock_load_fuel(request: LoadRequest):
    """
    Mock endpoint to simulate receiving data from a physical fuel dispenser.
    """
    # 1. Verify that the surtidor exists and is active
    surtidor_response = supabase.table("surtidores_config").select("*").eq("codigo_surtidor", request.codigo_surtidor).execute()
    if not surtidor_response.data:
        raise HTTPException(status_code=404, detail="Surtidor no encontrado")
        
    surtidor = surtidor_response.data[0]
    if surtidor.get("estado") != "activo":
        raise HTTPException(status_code=400, detail="El surtidor no está activo")

    # 2. Verify that the maquina exists
    maquina_response = supabase.table("maquinaria").select("*").eq("codigo_interno", request.codigo_maquina).execute()
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
         raise HTTPException(status_code=500, detail="Error al registrar el consumo")
         
    return {
        "status": "success",
        "message": "Carga de combustible registrada exitosamente",
        "data": insert_response.data[0]
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
