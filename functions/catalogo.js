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
    sef1: 'Professor Substituto de Ensino Fundamental I' } }
};
function pacote(item) {
  const m = /^pe-([a-z0-9]+)-([a-z0-9]+)$/.exec(String(item || ''));
  const c = m && CONCURSOS[m[1]];
  return c && c.cargos[m[2]] ? { item, conc: m[1], cargo: m[2], titulo: 'Plano de Estudo · ' + c.nome + ' · ' + c.cargos[m[2]] } : null;
}
module.exports = { CONCURSOS, pacote };
