import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock de Supabase
vi.mock('../src/lib/supabase', () => {
  const mockTable = (table: string) => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockImplementation(() => Promise.resolve({
      data: table === 'maquinaria' 
        ? [{ id: 'm1', codigo_interno: 'EXC-001', capacidad_deposito: 200, tipo_medicion: 'horas', centro_id: 'c1', centros_operativos: { nombre: 'Centro A' } }]
        : [{ id: 'c1', nombre: 'Centro A' }, { id: 'c2', nombre: 'Centro B' }],
      error: null
    })),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null })
  });

  return {
    supabase: {
      from: vi.fn().mockImplementation(mockTable)
    }
  };
});

// Mock de Lucide React
vi.mock('lucide-react', () => {
  const MockIcon = ({ "data-testid": testId }: any) => <div data-testid={testId} />;
  return {
    Wrench: () => <MockIcon data-testid="wrench" />,
    Pencil: () => <MockIcon data-testid="pencil" />,
    Trash2: () => <MockIcon data-testid="trash" />,
    Check: () => <MockIcon data-testid="check" />,
    Plus: () => <MockIcon data-testid="plus" />,
    X: () => <MockIcon data-testid="x" />,
    AlertCircle: () => <MockIcon data-testid="alert" />,
    Filter: () => <MockIcon data-testid="filter" />,
  };
});

import GestionMaquinas from '../src/pages/GestionMaquinas';

describe('GestionMaquinas Component CRUD', () => {
  it('debe permitir realizar operaciones CRUD', async () => {
    render(<GestionMaquinas />);
    
    // 1. CARGA INICIAL
    await waitFor(() => expect(screen.getByText('EXC-001')).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.getByText('200 L')).toBeInTheDocument();

    // 2. CREAR
    fireEvent.click(screen.getByText(/Nueva Máquina/i));
    fireEvent.change(screen.getByPlaceholderText(/Ex: EXC-001/i), { target: { value: 'EXC-002' } });
    fireEvent.change(screen.getByPlaceholderText(/0.00/i), { target: { value: '150' } });
    fireEvent.change(screen.getByDisplayValue(/Selecciona centro.../i), { target: { value: 'c2' } });
    fireEvent.click(screen.getByText(/Confirmar Alta/i));
    await waitFor(() => expect(screen.getByText(/Máquina creada correctamente/i)).toBeInTheDocument());

    // 3. EDITAR
    fireEvent.click(screen.getByTestId('pencil'));
    const inputEdit = screen.getByDisplayValue('EXC-001');
    fireEvent.change(inputEdit, { target: { value: 'EXC-001-MOD' } });
    fireEvent.click(screen.getByText(/Guardar/i));
    await waitFor(() => expect(screen.getByText(/Máquina actualizada/i)).toBeInTheDocument());

    // 4. ELIMINAR
    fireEvent.click(screen.getByTestId('trash'));
    fireEvent.click(screen.getByText(/Sí, eliminar todo/i));
    await waitFor(() => expect(screen.getByText(/Máquina eliminada correctamente/i)).toBeInTheDocument());
  });
});
