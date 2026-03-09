# DonaCuadratico 🎯 (QuadTip)

**Tipping Cuadrático para Farcaster a través de Celo.**

DonaCuadratico es una Mini App de Farcaster diseñada para revolucionar las propinas y donaciones a creadores de contenido, aprovechando el poder del **Fondeo Cuadrático (Quadratic Funding)** directamente dentro del feed social. Construida sobre la blockchain de **Celo**, permite a los usuarios enviar micro-propinas en `cUSD` que desbloquean geométricamente fondos de emparejamiento (matching pools), multiplicando el impacto del apoyo de la comunidad.

## 🌟 Puntos Clave del Hackathon

- **Nativo de Celo**: Completamente desplegado en Celo Sepolia, utilizando `cUSD` para micro-transacciones estables, con comisiones muy bajas e increíblemente rápidas.
- **Farcaster Mini App**: Farcaster Frame totalmente compatible que integra `@farcaster/frame-sdk` para una experiencia social integrada perfecta. Cuenta con generación dinámica de imágenes OpenGraph y un ciclo viral de compartir mediante Casts.
- **Resistencia Sybil con Human Passport**: Integrado con `@human.tech/passport-embed`. Tanto los creadores como los donantes deben demostrar su humanidad (Score $\geq$ 20) para participar, asegurando que la matemática cuadrática esté protegida contra ataques Sybil.
- **Simulación Matemática en Tiempo Real**: El frontend calcula y proyecta matemáticamente en vivo el match cuadrático $`(\sum \sqrt{tips})^2`$ mientras el usuario elige el monto de su donación.

## 🚀 Cómo Funciona (El Flujo)

1. **Verificación**: Los usuarios conectan su wallet y verifican su humanidad a través del widget Human Passport. Una vez verificados, la prueba se registra on-chain a través de una llamada de backend con gas subsidiado.
2. **Registro de Creadores**: Los humanos verificados pueden registrar sus wallets como creadores para la ronda de donaciones activa.
3. **Tipping (Donar)**: Cualquier usuario verificado puede visitar el perfil de un creador, seleccionar una cantidad de `cUSD` y ver el impacto proyectado en el matching.
4. **Ciclo Viral**: Después de confirmar la transacción, la app invita al usuario a compartir un Cast en Warpcast presumiendo su donación y el valor de matching generado.
5. **Finalización**: Al final de la ronda de 7 días, el Smart Contract calcula la distribución matemática exacta del matching pool y permite a los creadores reclamar sus fondos.

## 🛠 Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Web3 / Social**: wagmi, viem, `@farcaster/frame-sdk`, `@human.tech/passport-embed`
- **Smart Contracts**: Solidity ^0.8.20, Hardhat Ignition
- **Blockchain**: Celo Sepolia Testnet

## 🔗 Despliegue del Smart Contract

- **Red**: Celo Sepolia Testnet (Chain ID: 11142220)
- **Contrato QuadraticTipping**: `0x6A1A368162cE28f94E33Dbc72C4c82cA8A8476E6`
- **Token cUSD (Testnet)**: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`

## 💻 Guía de Inicio (Desarrollo Local)

Este es un monorepo gestionado por Turborepo.

### 1. Instalar dependencias
```bash
pnpm install
```

### 2. Configurar Variables de Entorno
Necesitarás archivos `.env` tanto en `apps/contracts` como en `apps/web`. Se proporciona una plantilla en `apps/web/.env.template`.
Asegúrate de incluir tu `PASSPORT_API_KEY`, `PASSPORT_SCORER_ID` y las claves privadas de tus wallets.

### 3. Iniciar la App de Next.js
```bash
pnpm dev
```
Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación en tu navegador.

### 4. Comandos del Smart Contract (en `apps/contracts`)
- Compilar contratos: `npx hardhat compile`
- Desplegar en Celo Sepolia: `npx hardhat ignition deploy ignition/modules/QuadraticTipping.ts --network celo-sepolia`

---
*Construido con ❤️ para el Ecosistema de Celo & Farcaster.*
