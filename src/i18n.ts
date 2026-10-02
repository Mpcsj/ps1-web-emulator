// UI strings in English and Brazilian Portuguese. The language is picked from the browser
// on first visit, then remembered (see I18nProvider.tsx). `pt` must have every key of `en`.
import { createContext, useContext } from 'react'

export type Lang = 'en' | 'pt'

const en = {
  tagline: 'In your browser',
  language: 'Language',

  statusIdle: 'Choose a game source to start.',
  statusLoaded: 'Emulator loaded, booting disc…',
  statusRunning: 'Running.',
  statusSaving: 'Saving memory card…',
  statusDownloading: 'Downloading emulator core and disc image…',

  insertDisc: 'Insert a disc to begin',
  playBundled: 'Play bundled disc',
  loadAnother: 'Load another disc',
  loadDisc: 'Load disc image',
  discHint: '.bin · .chd · .pbp — from a game you own',
  emulatorTitle: 'PS1 emulator',
  applyRestart: 'Apply & restart game',
  stop: 'Stop',
  restartNote: 'Memory card saves are kept. Progress since your last in-game save is lost, so use Save State in the emulator bar if needed.',

  padNone: 'No controller detected. Press any button on it to connect.',
  padUnassigned: 'not assigned in emulator',
  padPlayer1: 'Player 1',
  padLastInput: 'last input',

  cardTitle: 'Memory card',
  cardChecking: 'checking…',
  cardEmpty: 'empty',
  cardSaved: (when: string) => `saved ${when}`,
  justNow: 'just now',
  minAgo: (n: number) => `${n} min ago`,
  cardHint: 'Saves the game makes to its memory card are stored in this browser automatically, and shared by every graphics preset. Export a backup, or to move your progress to another device or address (e.g. localhost vs. your network IP): each keeps its own saves.',
  cardExport: 'Export .srm',
  cardImport: 'Import…',
  cardDelete: 'Delete',
  cardConfirmReplace: 'Replace the current memory card with this file? Export it first if you want a backup.',
  cardConfirmDelete: 'Delete this memory card? All saved progress for this game in this browser will be lost.',
  cardWrongSize: (file: string, size: number) => `${file} is ${size} bytes; a PS1 memory card is exactly 128 KB.`,

  graphics: 'Graphics',
  advanced: 'Advanced',
  custom: 'custom',
  core: 'Emulator core',
  corePcsx: 'PCSX-ReARMed (fast, native resolution)',
  coreBeetle: 'Beetle PSX (upscaling, heavier)',
  resolution: 'Internal resolution',
  res1x: '1× native (320×240)',
  shader: 'Post-process shader',
  noDither: 'Disable dithering (cleaner gradients)',
  widescreen: 'Widescreen hack (16:9, may glitch at edges)',
  // Preset and shader names; English ones come from src/graphics.ts.
  presets: {} as Record<string, [label: string, hint: string]>,
  shaders: {} as Record<string, string>,

  biosTitle: 'PS1 BIOS',
  biosInstalled: (name: string) => `installed (${name})`,
  biosBundled: 'using bundled OpenBIOS',
  biosHint: [
    'Beetle PSX needs a BIOS. It uses the bundled open-source ',
    ' (MIT, PCSX-Redux) by default. For best compatibility, load a dump from your own console, ideally the US ',
    ' (512 KB). It stays in this browser only.',
  ],
  biosReplace: 'Replace…',
  biosChoose: 'Choose BIOS file…',
  biosRemove: 'Remove',
  biosWrongSize: (file: string, size: number) => `${file} is ${size} bytes; a PS1 BIOS is exactly 512 KB.`,
}

export type Strings = typeof en

const pt: Strings = {
  tagline: 'No seu navegador',
  language: 'Idioma',

  statusIdle: 'Escolha um jogo para começar.',
  statusLoaded: 'Emulador carregado, iniciando o disco…',
  statusRunning: 'Rodando.',
  statusSaving: 'Salvando o memory card…',
  statusDownloading: 'Baixando o núcleo do emulador e a imagem do disco…',

  insertDisc: 'Insira um disco para começar',
  playBundled: 'Jogar disco incluído',
  loadAnother: 'Carregar outro disco',
  loadDisc: 'Carregar imagem de disco',
  discHint: '.bin · .chd · .pbp — de um jogo que você possui',
  emulatorTitle: 'Emulador de PS1',
  applyRestart: 'Aplicar e reiniciar o jogo',
  stop: 'Parar',
  restartNote: 'Os saves do memory card são mantidos. O progresso desde o último save no jogo será perdido; use Save State na barra do emulador se precisar.',

  padNone: 'Nenhum controle detectado. Aperte qualquer botão nele para conectar.',
  padUnassigned: 'não atribuído no emulador',
  padPlayer1: 'Jogador 1',
  padLastInput: 'último botão',

  cardTitle: 'Memory card',
  cardChecking: 'verificando…',
  cardEmpty: 'vazio',
  cardSaved: (when) => `salvo ${when}`,
  justNow: 'agora mesmo',
  minAgo: (n) => `há ${n} min`,
  cardHint: 'Os saves que o jogo grava no memory card ficam guardados neste navegador automaticamente e valem para todos os presets gráficos. Exporte um backup, ou para levar seu progresso a outro dispositivo ou endereço (ex.: localhost vs. o IP da sua rede): cada um guarda seus próprios saves.',
  cardExport: 'Exportar .srm',
  cardImport: 'Importar…',
  cardDelete: 'Apagar',
  cardConfirmReplace: 'Substituir o memory card atual por este arquivo? Exporte-o antes se quiser um backup.',
  cardConfirmDelete: 'Apagar este memory card? Todo o progresso salvo deste jogo neste navegador será perdido.',
  cardWrongSize: (file, size) => `${file} tem ${size} bytes; um memory card de PS1 tem exatamente 128 KB.`,

  graphics: 'Gráficos',
  advanced: 'Avançado',
  custom: 'personalizado',
  core: 'Núcleo do emulador',
  corePcsx: 'PCSX-ReARMed (rápido, resolução nativa)',
  coreBeetle: 'Beetle PSX (upscaling, mais pesado)',
  resolution: 'Resolução interna',
  res1x: '1× nativa (320×240)',
  shader: 'Shader de pós-processamento',
  noDither: 'Desativar dithering (degradês mais limpos)',
  widescreen: 'Hack widescreen (16:9, pode falhar nas bordas)',
  presets: {
    original: ['Original', '320×240 nativo, como num PS1 de verdade'],
    smooth: ['Suave', 'Velocidade nativa, sem dithering, bordas suavizadas com SABR'],
    enhanced: ['Melhorado', 'Resolução interna 2× (Beetle), sem dithering'],
    ultra: ['Ultra', 'Resolução interna 4× — pesado para a CPU, confira o fps'],
    crt: ['CRT retrô', 'Imagem nativa com shader de TV CRT'],
  },
  shaders: {
    disabled: 'Nenhum',
    sabr: 'SABR (bordas suaves)',
    bicubic: 'Bicúbico (suave)',
    'crt-easymode.glslp': 'CRT (easymode)',
    'crt-geom.glslp': 'CRT (curvo)',
    'crt-zfast': 'CRT (zfast, leve)',
  },

  biosTitle: 'BIOS do PS1',
  biosInstalled: (name) => `instalada (${name})`,
  biosBundled: 'usando a OpenBIOS incluída',
  biosHint: [
    'O Beetle PSX precisa de uma BIOS. Por padrão ele usa a ',
    ' de código aberto incluída (MIT, PCSX-Redux). Para melhor compatibilidade, carregue um dump do seu próprio console, de preferência a americana ',
    ' (512 KB). Ela fica apenas neste navegador.',
  ],
  biosReplace: 'Substituir…',
  biosChoose: 'Escolher arquivo da BIOS…',
  biosRemove: 'Remover',
  biosWrongSize: (file, size) => `${file} tem ${size} bytes; uma BIOS de PS1 tem exatamente 512 KB.`,
}

export const STRINGS: Record<Lang, Strings> = { en, pt }
// EmulatorJS localization file for its own menus (see public/player.html).
export const EJS_LANGUAGE: Record<Lang, string> = { en: 'en-US', pt: 'pt-BR' }
// For dates and the <html lang> attribute.
export const LOCALE: Record<Lang, string> = { en: 'en-US', pt: 'pt-BR' }

export type I18n = { lang: Lang; setLang: (l: Lang) => void; t: Strings }

export const I18nContext = createContext<I18n>({ lang: 'en', setLang: () => {}, t: en })

export const useI18n = () => useContext(I18nContext)
