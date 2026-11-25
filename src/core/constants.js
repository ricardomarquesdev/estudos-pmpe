export const STORAGE_KEY = 'pmpe-painel-v1';
export const LOCALE = 'pt-BR';
export const EXAM_DEFAULT = '2027-02-21';

export const SUBJECTS = [
  {
    id: 'portugues',
    name: 'Língua Portuguesa',
    short: 'Português',
    icon: '📖',
    block: 'Bloco I',
    color: '#7aa2ff',
  },
  {
    id: 'historia',
    name: 'História de Pernambuco',
    short: 'História de PE',
    icon: '🏰',
    block: 'Bloco I',
    color: '#ffb86b',
  },
  {
    id: 'rlm',
    name: 'Raciocínio Lógico',
    short: 'Rac. Lógico',
    icon: '🧠',
    block: 'Bloco II',
    color: '#c792ea',
  },
  {
    id: 'informatica',
    name: 'Informática',
    short: 'Informática',
    icon: '💻',
    block: 'Bloco II',
    color: '#4dd0e1',
  },
  {
    id: 'constitucional',
    name: 'Direito Constitucional',
    short: 'Constitucional',
    icon: '⚖️',
    block: 'Bloco III',
    color: '#f4c95d',
  },
  {
    id: 'dh',
    name: 'Direitos Humanos e Legislação Extravagante',
    short: 'DH e Legislação',
    icon: '🛡️',
    block: 'Bloco III',
    color: '#43e0a0',
  },
  {
    id: 'redacao',
    name: 'Redação',
    short: 'Redação',
    icon: '✍️',
    block: 'Redação',
    color: '#ff8fab',
  },
];

export const SUB_BY_ID = Object.fromEntries(SUBJECTS.map((subject) => [subject.id, subject]));
export const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];
export const VIEWS = new Set(['hoje', 'cronograma', 'desempenho', 'historico', 'ajustes']);
export const CRONO_TABS = new Set(['semana', 'plano', 'metas']);
export const PERF_TABS = new Set(['evolucao', 'simulados', 'taf']);
export const DEFAULT_GOALS = Object.fromEntries(SUBJECTS.map((subject) => [subject.id, 12]));

export const TAF_DATE_DEFAULT = '2027-07-23';
export const TAF_EXERCISES = [
  { id: 'barra', name: 'Barra fixa', icon: '💪', desc: 'Flexões ou isometria' },
  { id: 'salto', name: 'Salto em distância', icon: '🦘', desc: 'Com corrida de aproximação' },
  { id: 'natacao', name: 'Natação 50 m', icon: '🏊', desc: 'Nado livre' },
  { id: 'abdominal', name: 'Abdominal remador', icon: '🔥', desc: 'Repetições em 60 segundos' },
  { id: 'corrida', name: 'Corrida 2.400 m', icon: '🏃', desc: 'Pista de 300 ou 400 m' },
];
export const TAF_PRESETS = {
  m: { barra: '5', salto: '3,6', natacao: '1:00', abdominal: '40', corrida: '11:30' },
  f: { barra: '0:25', salto: '2,8', natacao: '1:10', abdominal: '36', corrida: '13:30' },
};
