declare module 'petrovich' {
  interface Person {
    first?: string;
    middle?: string;
    last?: string;
    gender?: 'male' | 'female' | 'androgynous';
  }

  interface DeclinedPerson {
    gender: 'male' | 'female' | 'androgynous';
    first: string;
    middle: string;
    last: string;
  }

  type Case = 'nominative' | 'genitive' | 'dative' | 'accusative' | 'instrumental' | 'prepositional';

  function petrovich(person: Person, gcase: Case): DeclinedPerson;

  export default petrovich;
}