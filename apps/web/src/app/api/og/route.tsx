import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Podemos recibir parametros por URL, ejemplo si queremos renderizar la ronda especifica
        const hasRound = searchParams.has('round');
        const roundNumber = hasRound ? searchParams.get('round') : "1";

        return new ImageResponse(
            (
                <div
                    style={{
                        backgroundColor: '#0a0a0f',
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'sans-serif',
                        padding: '40px',
                    }}
                >
                    {/* Background Decorator */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            backgroundImage: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(10, 10, 15, 1) 50%)',
                        }}
                    />

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 10,
                            color: 'white',
                        }}
                    >
                        <h1 style={{ fontSize: 80, fontWeight: 900, margin: 0, padding: 0 }}>
                            <span style={{ color: '#10b981' }}>Quad</span>
                            <span style={{ color: '#8b5cf6' }}>Tip</span>
                        </h1>
                        <h2 style={{ fontSize: 40, fontWeight: 600, color: '#a1a1aa', marginTop: 20 }}>
                            Ronda #{roundNumber} de Tipping Cuadrático
                        </h2>

                        <div
                            style={{
                                display: 'flex',
                                gap: '24px',
                                marginTop: '60px',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#18181b', padding: '30px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.1)' }}>
                                <span style={{ fontSize: 24, color: '#a1a1aa' }}>1 Tip</span>
                                <span style={{ fontSize: 48, fontWeight: 'bold', color: '#10b981' }}>= Más Impacto</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#18181b', padding: '30px', borderRadius: '20px', border: '2px solid rgba(139, 92, 246,0.3)' }}>
                                <span style={{ fontSize: 24, color: '#a1a1aa' }}>Fórmulas</span>
                                <span style={{ fontSize: 48, fontWeight: 'bold', color: '#8b5cf6' }}>Cuadráticas</span>
                            </div>
                        </div>

                        <p style={{ fontSize: 28, color: '#71717a', marginTop: '60px' }}>
                            Cada persona cuenta más que cada dólar.
                        </p>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
