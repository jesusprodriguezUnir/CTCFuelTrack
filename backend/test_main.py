import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

# Importar la app de FastAPI
from main import app, supabase

client = TestClient(app)

# Mockear la base de datos de Supabase para las pruebas
@pytest.fixture(autouse=True)
def mock_supabase(monkeypatch):
    mock_surtidor_data = [{"id": "s-123", "codigo_surtidor": "SURT-01", "estado": "activo"}]
    mock_maquina_data = [{"id": "m-123", "codigo_interno": "EXC-01", "capacidad_deposito": 100}]
    
    # Simular supabase.table().select().eq().execute()
    def mock_table(table_name):
        mock_query = MagicMock()
        
        if table_name == "surtidores_config":
            mock_query.select.return_value.eq.return_value.execute.return_value.data = mock_surtidor_data
        elif table_name == "maquinaria":
            mock_query.select.return_value.eq.return_value.execute.return_value.data = mock_maquina_data
        elif table_name == "registros_consumo":
            mock_query.insert.return_value.execute.return_value.data = [{"id": "r-123"}]
            
        return mock_query
            
    monkeypatch.setattr(supabase, "table", mock_table)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_mock_load_success():
    payload = {
        "codigo_surtidor": "SURT-01",
        "codigo_maquina": "EXC-01",
        "litros": 50.0
    }
    response = client.post("/api/surtidores/mock-load", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_mock_load_exceeds_capacity():
    payload = {
        "codigo_surtidor": "SURT-01",
        "codigo_maquina": "EXC-01",
        "litros": 150.0 # Capacidad mockeada es 100
    }
    response = client.post("/api/surtidores/mock-load", json=payload)
    
    assert response.status_code == 400
    assert "capacidad máxima" in response.json()["detail"]

def test_mock_load_negative_liters():
    payload = {
        "codigo_surtidor": "SURT-01",
        "codigo_maquina": "EXC-01",
        "litros": -10.0
    }
    response = client.post("/api/surtidores/mock-load", json=payload)
    
    assert response.status_code == 400
