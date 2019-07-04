# Typescript Sequence Diagrams

## TODO

Features:

* Text boundaries
* Loops
* Notes
* Handle incorrect inputs
* Compute SVG size based on what has to be drawn
* Participants order
* Diagram title
* Draw on input/textarea change

Bugs:

* trim messages
* padding for root svg object

Tech stuff:

* Move test code from index.ts to test/basic.html
* Error handling
  * use exceptions
  * use error codes
* Export as a module
* Automate the grammar build (use make)
* use https://svgjs.com instead of snap

Test cases:

* Actor creation in the middle of some classic actors

## Build the grammar

```
npm install jison -g
jison src/grammar/SequenceDiagram.jison --outfile src/grammar/SequenceDiagram.js --module-type js
```

export the generated code as a module. SequenceDiagram.js:

```
Parser.prototype.parse = parser.parse;
return new Parser;
})();
export default SequenceDiagram;
```

## Run

```
npm run-script watch
```

Open `./test/basic.html`