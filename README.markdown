# couch-asdesigndoc

Transform functions inside a Design Doc object to strings suitable for CouchDB


### Installation

```bash
$ npm install couch-asdesigndoc
```

### Example

```javascript
const asDesignDoc = require('couch-asdesigndoc')
const PouchDB = require('pouchdb-node')
let db = new PouchDB('example')

db.put(asDesignDoc({
  _id: '_design/test',
  views: {
    simple: {
      map(doc) { emit(doc.date, doc.title) }
    }
  }
})
```

