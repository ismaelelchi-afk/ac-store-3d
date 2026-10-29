# A/C Store 3D

Loja conceito tridimensional de canecas de café e garrafas de água, construída com **Three.js**, **TypeScript** e **Vite**. A cena utiliza geometria procedural, identidade visual azul-marinho e dourada, navegação por pontos de vista e um editor de câmeras com poses persistentes.

O projeto é uma experiência visual e interativa de vitrine. Não possui API, backend, banco de dados, autenticação, estoque ou checkout.

## Recursos

- Loja 3D com arquitetura, iluminação, sinalização, produtos e embalagens gerados proceduralmente.
- Departamentos de canecas, garrafas de água, parede da marca, caixa e presentes.
- Cinco pontos de vista comerciais com transições suaves.
- Navegação livre com deslocamento, elevação, rotação e zoom.
- Editor de câmeras por ponto de vista, com posição, ponto de mira, salvamento e restauração.
- Poses personalizadas persistidas no `localStorage` do navegador.
- Renderização sob demanda, adequada para uso em dispositivos móveis.
- Interface responsiva, com suporte a toque, mouse e teclado.

## Tecnologias

- [Three.js](https://threejs.org/) 0.169
- [TypeScript](https://www.typescriptlang.org/) 5.6 ou superior em modo estrito
- [Vite](https://vitejs.dev/) 5.4
- CSS nativo, Canvas 2D e WebGL
- Sem modelos, texturas ou recursos remotos

## Requisitos

- Node.js 18 ou superior (recomendado: Node.js 20 ou superior)
- npm
- Navegador moderno com suporte a WebGL e módulos ES2020

## Instalação

```bash
git clone https://github.com/ismaelelchi-afk/ac-store-3d.git
cd ac-store-3d
npm install
```

O projeto utiliza `package-lock.json`. Para uma instalação reproduzível, também é possível usar `npm ci`.

## Desenvolvimento local

```bash
npm run dev
```

O servidor do Vite abre por padrão em `http://localhost:5173`. A configuração usa `host: true`, portanto o endereço exibido no terminal também pode ser aberto por outro dispositivo na mesma rede local.

## Compilação de produção

```bash
npm run build
npm run preview
```

`npm run build` executa a verificação do TypeScript e gera a versão otimizada em `dist/`. `npm run preview` serve localmente essa compilação. O build utiliza caminhos relativos, permitindo hospedá-lo em subdiretórios.

Não há suíte de testes automatizados configurada no `package.json`.

## Controles e navegação

### Modo comercial

- Arraste o cenário com o dedo ou o mouse para olhar ao redor.
- Use a roda do mouse para aplicar zoom.
- Utilize os botões inferiores para visitar **Entrada**, **Tazas**, **Garrafas**, **Caja** e **Regalos**.
- No teclado, as teclas `1` a `5` acessam os pontos de vista; as setas ajustam a direção da câmera.

### Modo de câmera livre

- Toque três vezes no monograma **A/C** para entrar no modo livre.
- Arraste a cena para girar a câmera.
- Use o joystick no canto inferior esquerdo para se deslocar.
- Use **Subir** e **Descer** para alterar a altura da câmera.
- Use **SAIR** para retornar à vista comercial ativa.

## Zonas comerciais e pontos de vista

A planta da loja é dividida em dez zonas geométricas usadas na composição e na organização dos departamentos: parede da marca, parede de canecas, coleção premium, ilhas de canecas, estantes de garrafas, paletes de garrafas, dispensadores e garrafas, água premium, caixa e presentes.

A navegação comercial utiliza cinco pontos de vista fixos, definidos em `src/scene/store/constants.ts`:

| Código | Rótulo na interface |
| --- | --- |
| `entrada` | Entrada |
| `tazas` | Tazas |
| `garrafas` | Garrafas |
| `caja` | Caja |
| `regalos` | Regalos |

As poses padrão podem ser ajustadas pelo editor e substituídas por poses salvas localmente.

## Editor de câmeras

No modo de câmera livre, use o botão de lápis para abrir o editor.

- O editor é aberto minimizado no primeiro acesso e mantém seu estado durante a sessão.
- Selecione uma das cinco vistas comerciais.
- Ajuste a **posição** da câmera e o **ponto de mira** nos campos numéricos.
- **Salvar posição** grava a pose da vista selecionada.
- **Restaurar posição original** remove a personalização após confirmação.
- As poses são persistidas por vista no `localStorage`, sob a chave `ac-store-3d.commercial-view-poses.v1`.
- Ao sair do modo livre, a câmera retorna à vista ativa, considerando a pose salva ou restaurada.

Os dados de personalização permanecem somente no navegador do usuário. Limpar os dados do site remove as poses salvas.

## Estrutura do projeto

```text
src/
  main.ts                      integração da cena, navegação, câmera livre e editor
  styles.css                   interface responsiva e identidade visual
  core/
    camera.ts                  câmera perspectivista
    renderer.ts                renderer WebGL e controle de pixel ratio
    freeCameraController.ts    deslocamento, rotação, altura e limites da câmera livre
  scene/store/
    constants.ts               dimensões, paleta, zonas e pontos de vista
    storeCamera.ts             CameraRig e transições entre poses
    commercialCamera.ts        adaptação dos pontos de vista ao editor
    commercialViewPreferences.ts persistência das poses personalizadas
    storeScene.ts              montagem da loja
    architecture.ts            piso, paredes, fachada e teto
    lighting.ts                iluminação e painéis
    materials.ts, textures.ts  materiais compartilhados e texturas procedurais
    library.ts                 catálogo e substituição de produtos
    signage.ts                 sinalização e rótulos
    products/                  canecas, garrafas e expositores
    departments/               departamentos comerciais
  ui/
    commercialViewEditor.ts    interface do editor de câmeras
index.html                     estrutura da interface
vite.config.ts                 configuração do Vite
tsconfig.json                  configuração estrita do TypeScript
```

## Personalização de produtos

Os produtos são criados por meio de `ProductLibrary`. É possível substituir um tipo de produto por uma implementação própria, incluindo modelos GLB, registrando um override antes da construção dos departamentos em `StoreScene`.

```ts
store.products.registerOverride('cup', (options) => cloneDoModeloGlb(options));
```

## Licença

A licença de uso ainda não foi definida pelo titular do projeto. Este repositório não inclui um arquivo `LICENSE`; portanto, não há autorização de uso, cópia, modificação ou distribuição além das previstas em lei até que uma licença seja formalizada.
