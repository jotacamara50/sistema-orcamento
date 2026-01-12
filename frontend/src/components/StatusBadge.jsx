const statusLabels = {
    rascunho: 'Rascunho',
    enviado: 'Enviado',
    aprovado: 'Aprovado',
    recusado: 'Recusado'
};

export default function StatusBadge({ status }) {
    return (
        <span className={`badge badge-${status}`}>
            {statusLabels[status] || status}
        </span>
    );
}
