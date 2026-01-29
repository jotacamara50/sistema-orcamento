import { useState, useEffect } from 'react';

export default function FirstTimeTooltip() {
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        if (!hasSeenTutorial) {
            setTimeout(() => setShow(true), 1000);
        }
    }, []);

    const steps = [
        {
            title: 'Bem-vindo! 👋',
            message: 'Vou te mostrar como criar seu primeiro orçamento em 3 passos simples.',
            position: 'center'
        },
        {
            title: '1️⃣ Crie um Cliente',
            message: 'Primeiro, adicione o cliente que vai receber o orçamento.',
            position: 'top'
        },
        {
            title: '2️⃣ Preencha os Serviços',
            message: 'Liste os serviços e valores que você vai cobrar.',
            position: 'top'
        },
        {
            title: '3️⃣ Envie pelo WhatsApp',
            message: 'Pronto! É só baixar o PDF e enviar pro cliente. Simples assim! 🚀',
            position: 'top'
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        localStorage.setItem('hasSeenTutorial', 'true');
        setShow(false);
    };

    if (!show) return null;

    const currentStep = steps[step];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: currentStep.position === 'center' ? 'center' : 'flex-start',
            justifyContent: 'center',
            padding: 'var(--space-xl)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-xl)',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                textAlign: 'center',
                marginTop: currentStep.position === 'top' ? '80px' : '0'
            }}>
                <h2 style={{ marginBottom: 'var(--space-md)', fontSize: '1.5rem' }}>
                    {currentStep.title}
                </h2>
                <p style={{ 
                    color: 'var(--text-secondary)', 
                    marginBottom: 'var(--space-xl)',
                    fontSize: '1.1rem',
                    lineHeight: '1.6'
                }}>
                    {currentStep.message}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                    <button
                        onClick={handleClose}
                        className="btn btn-secondary"
                    >
                        Pular
                    </button>
                    <button
                        onClick={handleNext}
                        className="btn btn-primary"
                    >
                        {step < steps.length - 1 ? 'Próximo' : 'Entendi!'}
                    </button>
                </div>
                <div style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {step + 1} de {steps.length}
                </div>
            </div>
        </div>
    );
}
