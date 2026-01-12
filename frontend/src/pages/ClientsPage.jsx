import { useState, useEffect } from 'react';
import { clients as clientsApi } from '../api';
import Navbar from '../components/Navbar';

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const res = await clientsApi.list();
            setClients(res.data);
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                nome: client.nome,
                telefone: client.telefone || '',
                email: client.email || ''
            });
        } else {
            setEditingClient(null);
            setFormData({ nome: '', telefone: '', email: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingClient(null);
        setFormData({ nome: '', telefone: '', email: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await clientsApi.update(editingClient.id, formData);
            } else {
                await clientsApi.create(formData);
            }
            loadClients();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Erro ao salvar cliente');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja deletar este cliente?')) {
            try {
                await clientsApi.delete(id);
                loadClients();
            } catch (error) {
                console.error('Error deleting client:', error);
                alert('Erro ao deletar cliente');
            }
        }
    };

    return (
        <div>
            <Navbar />

            <div className="container page">
                <div className="flex justify-between items-center mb-xl">
                    <h1>Clientes</h1>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        + Novo Cliente
                    </button>
                </div>

                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-xl)' }}>
                        Carregando...
                    </div>
                ) : clients.length === 0 ? (
                    <div className="empty-state">
                        <h3>Nenhum cliente cadastrado</h3>
                        <p>Adicione seus clientes para criar orçamentos</p>
                        <button onClick={() => handleOpenModal()} className="btn btn-primary mt-lg">
                            Adicionar Primeiro Cliente
                        </button>
                    </div>
                ) : (
                    <div className="card">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Telefone</th>
                                    <th>Email</th>
                                    <th style={{ width: '150px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id}>
                                        <td><strong>{client.nome}</strong></td>
                                        <td>{client.telefone || '-'}</td>
                                        <td>{client.email || '-'}</td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button
                                                    onClick={() => handleOpenModal(client)}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client.id)}
                                                    className="btn btn-danger btn-sm"
                                                >
                                                    Deletar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-lg">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Nome do cliente"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Telefone</label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="(11) 99999-9999"
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="cliente@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-md">
                                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
