/* Concursos e cargos à venda (preço e nomes conferidos aqui no servidor). */
const CONCURSOS = {
  arcoiris: { nome: 'Arco-Íris (SP) 01/2026', cargos: {
    ei: 'Professor de Educação Infantil', peb1: 'Professor de Educação Básica I', assist: 'Professor Assistente',
    esp: 'PEB II Educação Especial', ef: 'PEB II Educação Física', mus: 'PEB II Música' } },
  echapora: { nome: 'Echaporã (SP) PS 01/2026', cargos: {
    peb1: 'PEB I – Professor de Ensino Básico I', arte: 'PEB II – Artes', esp: 'PEB II – Educação Especial',
    ef: 'PEB II – Educação Física', ing: 'PEB II – Inglês' } },
  lencois: { nome: 'Lençóis Paulista (SP) CP 03/2026', cargos: {
    dir: 'Diretor de Escola', ei1: 'Professor de Educação Infantil I', ei2: 'Professor de Educação Infantil II',
    ef1: 'Professor de Ensino Fundamental I', ef2m: 'Professor de Ensino Fundamental II – Matemática' } },
  lencoisps: { nome: 'Lençóis Paulista (SP) PS 01/2026', cargos: {
    ee: 'Professor de Educação Especial',
    arte: 'Professor de Ensino Fundamental II – Arte',
    cie: 'Professor de Ensino Fundamental II – Ciências',
    edf: 'Professor de Ensino Fundamental II – Educação Física',
    geo: 'Professor de Ensino Fundamental II – Geografia',
    his: 'Professor de Ensino Fundamental II – História',
    ing: 'Professor de Ensino Fundamental II – Inglês',
    lpo: 'Professor de Ensino Fundamental II – Português',
    sei: 'Professor Substituto de Educação Infantil',
    sef1: 'Professor Substituto de Ensino Fundamental I' } },
  birigui: { nome: 'Birigui (SP) CP 01/2026', cargos: {
    aux: 'Professor Auxiliar' } },
  lucelia: { nome: 'Lucélia (SP) PS 003/2026', cargos: {
    ei1: 'Professor de Educação Infantil I',
    ei2: 'Professor de Educação Infantil II',
    peb1: 'Professor de Educação Básica I',
    ing: 'PEB II – Inglês',
    his: 'PEB II – História',
    geo: 'PEB II – Geografia',
    lpo: 'PEB II – Língua Portuguesa',
    mat: 'PEB II – Matemática',
    cie: 'PEB II – Ciências Físicas e Biológicas',
    edf: 'PEB II – Educação Física',
    arte: 'PEB II – Arte' } },
  gsalgado: { nome: 'General Salgado (SP) CP 01/2026', cargos: {
    dir: 'Diretor de Escola',
    coord: 'Professor Coordenador',
    aux1: 'Professor Auxiliar I',
    lp: 'Professor Auxiliar II – Língua Portuguesa',
    mt: 'Professor Auxiliar II – Matemática' } },
  lins: { nome: 'Lins (SP) PS Educação 002/2026', cargos: {
    peb1: 'Professor de Educação Básica I – PEB I',
    arte: 'PEB II – Arte',
    cie: 'PEB II – Ciências Físicas e Biológicas',
    edf: 'PEB II – Educação Física',
    geo: 'PEB II – Geografia',
    his: 'PEB II – História',
    inf: 'PEB II – Informática',
    ing: 'PEB II – Inglês',
    lpo: 'PEB II – Língua Portuguesa',
    mt: 'PEB II – Matemática' } },
  caiabu: { nome: 'Caiabu (SP) CP 001/2026', cargos: {
    coord: 'Coordenador Pedagógico',
    creche: 'Professor de Creche',
    ei: 'Professor de Educação Infantil',
    arte: 'PEB II – Artes',
    edf: 'PEB II – Educação Física',
    ing: 'PEB II – Inglês' } },
  unesp: { nome: 'Vestibular Unesp 2027', precos: { f12: 59.9 }, cargos: {
    f1: '1ª fase: Conhecimentos Gerais',
    f12: '1ª + 2ª fase: pacote completo' } },
  piracicaba: { nome: 'Piracicaba (SP) PS 01/2026', cargos: {
    ei: 'Professor Substituto de Educação Infantil',
    ef: 'Professor Substituto de Ensino Fundamental' } },
  matao: { nome: 'Matão (SP) PS 01/2026', cargos: {
    ei: 'Professor I – Educação Infantil (0 a 6 anos)',
    ef: 'Professor I – Ensino Fundamental (Anos Iniciais)',
    da: 'Professor de Educação Especial – Deficiência Auditiva',
    di: 'Professor de Educação Especial – Deficiência Intelectual',
    dv: 'Professor de Educação Especial – Deficiência Visual',
    lp: 'Professor III – Português',
    mt: 'Professor III – Matemática',
    geo: 'Professor III – Geografia',
    cie: 'Professor III – Ciências',
    ing: 'Professor III – Inglês',
    fil: 'Professor III – Filosofia',
    art: 'Professor III – Arte/Educação Artística',
    his: 'Professor III – História',
    qui: 'Professor III – Química',
    bio: 'Professor III – Biologia',
    fis: 'Professor III – Física',
    soc: 'Professor III – Sociologia',
    mus: 'Professor III – Arte Musical',
    cen: 'Professor III – Artes Cênicas',
    edf: 'Professor III – Educação Física',
    dan: 'Professor III – Educação Física: Dança',
    gin: 'Professor III – Educação Física: Ginástica Geral',
    nat: 'Professor III – Educação Física: Natação' } }
};
/* Apostilas em PDF à venda (item ap-<concurso>-<cargo>); o arquivo cifrado fica em apostilas/<item>.bin. */
const APOSTILAS = { 'ap-arcoiris-ei': 39.9, 'ap-arcoiris-peb1': 39.9, 'ap-piracicaba-ei': 39.9, 'ap-piracicaba-ef': 39.9,
  'ap-arcoiris-assist': 39.9, 'ap-arcoiris-esp': 39.9, 'ap-arcoiris-ef': 39.9, 'ap-arcoiris-mus': 39.9 };
function pacote(item) {
  item = String(item || '');
  const m = /^(pe|ap)-([a-z0-9]+)-([a-z0-9]+)$/.exec(item);
  const c = m && CONCURSOS[m[2]];
  if (!c || !c.cargos[m[3]]) return null;
  if (m[1] === 'ap') return APOSTILAS[item] ? { item, conc: m[2], cargo: m[3], preco: APOSTILAS[item], apostila: true, titulo: 'Apostila em PDF · ' + c.nome + ' · ' + c.cargos[m[3]] } : null;
  return { item, conc: m[2], cargo: m[3], preco: (c.precos && c.precos[m[3]]) || null, titulo: 'Plano de Estudo · ' + c.nome + ' · ' + c.cargos[m[3]] };
}
module.exports = { CONCURSOS, APOSTILAS, pacote };
