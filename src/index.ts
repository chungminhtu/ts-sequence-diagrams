import Parser from "./parser/Parser";
import ParserScope from "./parser/ParserScope";
import SvgEngine from "./draw/SvgEngine";

var parser = new Parser();
var data: ParserScope = parser.parse(`
Vianney->Server: GET /ping
Server->Backend: hey you
Backend-->Server: what?
Server->Backend: ping
Backend->Backend: process
Backend-->Server: pong
Server-->Vianney: pong
Vianney->Backend: shutdown
`);

var svgEngine = new SvgEngine("diagram-container");

svgEngine.drawActors(data.actors);
svgEngine.drawSignals(data.signals);