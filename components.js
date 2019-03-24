const Card = Vue.component('this-card', {
  template: '#this-card',
  props: {
    word: {
      type: Object,
      default: {
        word: 'Несуществующее слово'
      }
    },
    status: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      open: {
        desc: false,
        author: false,
        authorDetails: false,
        newDesc: false
      },
      currentState: 0,
      valid: {
        desc: false
      },

      show: {}
    }
  },
  methods: {
    descOptions(id) {
      this.show[id] = true;
    }
  },
  mounted() {

  },
  computed: {
    parts() {
      let stress = this.word.stress;
      let arr = [...this.word.word];
      let parts = [];
      parts[0] = arr.slice(0, stress).join('');
      parts[1] = arr.slice(stress, stress + 1).join('');
      parts[2] = arr.slice(stress + 1).join('');
      return parts
    }
  }
})


const Add = Vue.component('this-add', {
  template: '#this-add',
  props: {
    add: Object
  },
  data() {
    return {
      newWord: true,
      newStep: 0,
      data:{},
      author: {
        name: '',
        net: 'instagram',
        account: ''
      },
      valid: {
        word: false,
        desc: false,
        author: false
      },
      rules: {
        name: [
          v => !!v || 'Представьтесь, пожалуйста'
        ],
        account: [
          v => /[a-zA-Z0-9_.]*/.test(v) || 'Таких аккаунтов не бывает'
        ],
        desc: [
          v => (v && v.length < 140) || 'Слишком длинное определение',
          v => (v && v.length > 7) || 'Слишком короткое определение'
        ]
      },
      nets: [{
          name: 'instagram',
          url: 'https://instagram.com/'
        },
        {
          name: 'vk',
          url: 'https://vk.com/'
        },
        {
          name: 'facebook',
          url: 'https://facebook.com/'
        },
        {
          name: 'twitter',
          url: 'https://twitter.com/'
        }
      ]
    }
  },
  methods: {
    getAnonym() {
      let filter = {
        name: 'Аноним'
      }
    },
    findAuthor() {
      let filter = {
      };
      if (!this.author.name) {
        filter.name={eq:'Аноним'}
      } else if (!this.author.account) {
        filter.name= {eq:this.author.name}
      } else {
        filter.net= {eq:this.author.net};
        filter.account= {eq:this.author.account}
      }
      console.log(filter)
      return client.getItems('authors', {filter})
    },
    createAuthor() {
      return client.createItem('authors', {
        name: this.author.name,
        status: 'draft',
        net: this.author.net,
        account: this.author.account
      })
    },
    createDesc() {
      return client.createItem('desc', {
        text: this.add.desc,
        author: this.data.authorId,
        primary_word: this.data.wordId,
        status: 'draft'
      })
    },
    addDescToWord() {
      return client.updateItem('words', this.data.wordId, {
        primary_desc: this.data.descId
      })
    },
    createWord() {
      return client.createItem('words', {
        status: 'draft',
        word: this.add.word,
        author: this.data.authorId,
        stress: this.add.stress,
        primary_desc: this.data.descId,
      })
    },
    createWordsDesc() {
      return client.createItem('words_desc', {
        words_id: this.data.wordId,
        desc_id: this.data.descId
      })
    },
    createAuthorsWords() {
      return client.createItem('authors_words', {
        authors_id: this.data.authorId,
        words_id: this.data.wordId
      })
    },
    createAuthorsDesc() {
      return client.createItem('authors_desc', {
        authors_id: this.data.authorId,
        desc_id: this.data.descId
      })
    },
    success() {
      if (this.data.added) {
        this.$emit('added', this.data.added);
      }
      this.$emit('load', undefined);
      console.log('success');
    },
    send() {
      let data = {}
      console.log(this.add)
      let create;

      //Получаем автора (Аноним - тоже автор)
      let getAuthor = this.findAuthor()
        //Ищем и получаем список
          .then (authorList => {
            let response;
            //Если список не пустой — берем первое совпадение
            if (authorList.data.length>0) {
              this.data.authorId = authorList.data[0].id
              response = authorList.data[0];
            } else {
              //Иначе создаём нового автора
              response = this.createAuthor()
            }
            return response
          })
          .then(author => {
            //Записываем автора
            this.data.authorId=author.id
          })
          .catch(e=>{console.log(e)})


          // ЕСЛИ СЛОВО УЖЕ ЕСТЬ - вызов из карточки
        if (this.add.id) {
        //  Добавляем определение к имеющемуся слову
          this.data.wordId=this.add.id;
          create = getAuthor.then(() =>{
            return this.createDesc()
          })
            // Добавляем связь
            .then( desc => {
              this.$emit('load', 50)
              this.data.descId=desc.data.id;
              return this.createWordsDesc()
            })
            .then(() => {
              return this.createAuthorsDesc()
            })
            .catch(e=>console.log(e))
        }

        if (!this.add.id) {
          // Добавляем новое слово
          create = getAuthor.then(() => {
            return this.createWord()
          })
            //Добавляем новое определение
            .then( word => {
              this.data.added = this.add.word;
              this.$emit('load', 20);
              this.data.wordId = word.data.id;
              return this.createDesc()
            })
            //Добавляем связь
            .then( desc => {
              this.$emit('load', 40);
              this.data.descId = desc.data.id;
              return this.createWordsDesc()
            })
            //Добавляем определение к слову
            .then( link => {
              return this.addDescToWord()
            })
            .then( link => {
              return this.createAuthorsDesc()
            })
            .then( link => {
              return this.createAuthorsWords()
            })
            .catch(e=>console.log(e))
        }

        //Завершаем процесс
        create.then(this.success)




      if (this.author.name) {
        console.log('with author')
      }
    }
  },
  computed: {
    parts() {

      let stress = this.add.stress;
      let arr = this.add.word.split('');
      let parts = [];
      if (arr.length > 0) {
        arr[0] = arr[0].toUpperCase();
        parts[0] = arr.slice(0, stress).join('');

        parts[1] = arr.slice(stress, stress + 1).join('');

        parts[2] = arr.slice(stress + 1).join('');

      } else {
        parts = ['', '', '']
      }
      return parts
    },
    baseFilter() {
      let bases = []
      if (this.filter.draft) {

      }
    }
  },
  created() {
    if (this.add.id) {
      this.newWord = false;
    }
  }
});
