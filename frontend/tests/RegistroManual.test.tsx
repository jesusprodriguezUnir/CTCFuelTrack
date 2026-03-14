import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Es fundamental hacer el hoisting del mock ANTES de importar el componente
vi.mock('../src/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'maquinaria') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { id: '1', codigo_interno: 'EXC-001', capacidad_deposito: 200 }
              ],
              error: null
            })
          };
        }
        if (table === 'registros_consumo') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      }),
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      }
    }
  };
});

// Importar el componente DESPUÉS del mock
import RegistroManual from '../src/pages/RegistroManual';

describe('RegistroManual Component', () => {
  it('debe renderizar el formulario correctamente', async () => {
    render(<RegistroManual />);
    
    // Esperar a que cargen las opciones del select
    await waitFor(() => {
      expect(screen.getByText(/EXC-001/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Seleccionar Máquina/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Litros Repostados/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar Repostaje/i })).toBeInTheDocument();
  });

  it('debe mostrar error si se supera la capacidad máxima', async () => {
    render(<RegistroManual />);

    await waitFor(() => {
      expect(screen.getByText(/EXC-001/i)).toBeInTheDocument();
    });

    // Seleccionar la máquina y poner un valor mayor a 200
    const select = screen.getByLabelText(/Seleccionar Máquina/i);
    const inputLitros = screen.getByLabelText(/Litros Repostados/i);
    const btnSubmit = screen.getByRole('button', { name: /Confirmar Repostaje/i });

    fireEvent.change(select, { target: { value: '1' } });
    fireEvent.change(inputLitros, { target: { value: '250' } });
    fireEvent.click(btnSubmit);

    // Esperar validación
    await waitFor(() => {
      expect(screen.getByText(/Superaste la capacidad máxima/i)).toBeInTheDocument();
    });
  });
});
