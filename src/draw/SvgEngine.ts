import Actor from "../model/Actor";
import * as Snap from 'snapsvg';
import {LineType, Signal} from "../model/Signal";

export default class SvgEngine {

    paper: Snap.Paper;
    actors: Snap.Element[];

    constructor(svgElementId: string) {
        var el = document.getElementById(svgElementId) as unknown as SVGElement;
        this.paper = Snap(el);
        this.actors = [];
    }

    drawSignals(signals: Signal[]) {
        const DISTANCE_BETWEEN_SIGNALS = 50;
        var offsetY = DISTANCE_BETWEEN_SIGNALS;

        for(const signal of signals) {
            this.drawSignal(signal, offsetY);

            offsetY += DISTANCE_BETWEEN_SIGNALS;
        }
    }

    drawSignal(signal: Signal, offsetY: number) {
        const MARKER_END = this.paper.path('M 0 0 L 5 2.5 L 0 5 z').marker(0, 0, 5, 5, 5, 2.5);
        const rectActorA = this.actors.filter(actor => actor.attr("actor-name") === signal.actorA.name).pop();
        const rectActorB = this.actors.filter(actor => actor.attr("actor-name") === signal.actorB.name).pop();
        
        if(rectActorA && rectActorB) {
            const signalToSelf = signal.actorA.name === signal.actorB.name; 
            
            if(signalToSelf) {
                const SIGNAL_SELF_WIDTH = 25;
                const SIGNAL_SELF_HEIGHT = 50;
                const SIGNAL_SELF_TEXT_OFFSET_X = SIGNAL_SELF_WIDTH + 5;
                const SIGNAL_SELF_TEXT_OFFSET_Y = SIGNAL_SELF_HEIGHT / 2;

                /*
                       y1

                x1   ---       x2
                       | text
                x1   <--       x2

                       y2
                */
                const x1 = (rectActorA.getBBox().width / 2) + rectActorA.getBBox().x;
                const x2 = x1 + SIGNAL_SELF_WIDTH;
                const y1 = rectActorA.getBBox().h + offsetY;
                const y2 = y1 + SIGNAL_SELF_HEIGHT;
                const textX = x1 + SIGNAL_SELF_TEXT_OFFSET_X;
                const textY = y1 + SIGNAL_SELF_TEXT_OFFSET_Y;

                var line1 = this.paper.line(x1, y1, x2, y1);
                line1.attr({
                    "stroke": "black",
                    "stroke-width": 2
                });

                var line2 = this.paper.line(x2, y1, x2, y2);
                line2.attr({
                    "stroke": "black",
                    "stroke-width": 2
                });

                var line3 = this.paper.line(x2, y2, x1, y2);
                line3.attr({
                    "stroke": "black",
                    "stroke-width": 2,
                    'markerEnd': MARKER_END
                });

                var text = this.drawText(textX, textY, signal.message);

            } else {
                const SIGNAL_TEXT_OFFSET_X = 5;
                const SIGNAL_TEXT_OFFSET_Y = 5;

                const signalAX = (rectActorA.getBBox().width / 2) + rectActorA.getBBox().x;
                const signalBX = (rectActorB.getBBox().width / 2) + rectActorB.getBBox().x;
                const signalY = rectActorA.getBBox().h + offsetY;
                const dottedLine = signal.lineType === LineType.RESPONSE;
    
                var signalLine = this.paper.line(signalAX, signalY, signalBX, signalY);
                signalLine.attr({
                    "stroke": "black",
                    "stroke-width": 2,
                    'markerEnd': MARKER_END
                });
                if(dottedLine) {
                    signalLine.attr({
                        "stroke-dasharray": "5,5"
                    });
                }
    
                const signalGoingForward = (signalAX - signalBX) < 0;
    
                if(signalGoingForward) {
                    console.log(`Signal going forward from ${signal.actorA.name} to ${signal.actorB.name}`);
                    const textX = signalAX + SIGNAL_TEXT_OFFSET_X;
                    const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
                    this.drawText(textX, textY, signal.message);
                } else {
                    console.log(`Signal going backward from ${signal.actorA.name} to ${signal.actorB.name}`);
                    
                    // First, draw the text
                    var textX = signalAX - SIGNAL_TEXT_OFFSET_X;
                    const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
                    var text = this.drawText(textX, textY, signal.message);
                    
                    // Get its width so it can be moved right
                    const textWidth = text.getBBox().w;
    
                    // Remove the current text
                    text.remove();
    
                    // And create a new one that will be correctly placed
                    textX = textX - textWidth;
                    text = this.drawText(textX, textY, signal.message);
                }
            }
        } else {
            console.warn(`Could not draw signal: ${signal}`);
        }
    }

    drawActors(actors: Actor[]) {
        var offsetX = 0;
        const DISTANCE_BETWEEN_ACTORS = 200;

        for (var actorName in actors) {

            var actor = actors[actorName];

            var actorRect = this.drawActor(actor, offsetX, 0);
            this.actors.push(actorRect);

            offsetX += DISTANCE_BETWEEN_ACTORS;
        }
    }

    drawActor(actor: Actor, x: number, y: number) {

        const RECT_WIDTH = 100;
        const RECT_HEIGHT = 50;
        const LIFE_LINE_HEIGHT = 500;
        const TEXT_CENTERED = true;

        console.log(`Drawing Actor ${actor.name}`);

        var rect: Snap.Element = this.drawRect(x, y, RECT_WIDTH, RECT_HEIGHT);
        rect.attr({
            "actor-name": actor.name
        });

        // align center
        var textX = (RECT_WIDTH / 2) + x;
        var textY = RECT_HEIGHT / 2;
        var text: Snap.Element = this.drawText(textX, textY, actor.name, TEXT_CENTERED);

        var lineX = x + (RECT_WIDTH / 2);
        var lineY1 = RECT_HEIGHT;
        var lineY2 = RECT_HEIGHT + LIFE_LINE_HEIGHT;

        var lifeLine = this.paper.line(lineX, lineY1, lineX, lineY2);
        lifeLine.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        return rect;
    }

    drawRect(x: number, y: number, w: number, h: number) {
        var rect = this.paper.rect(x, y, w, h);
        rect.attr({
            'stroke': 'black',
            'stroke-width': 2,
            'fill': 'white'
        });
        return rect;
    }

    drawText(x: number, y: number, text: string, centered?: boolean) {
        var t = this.paper.text(x, y, text);

        if(centered) {
            t.attr({
                "dominant-baseline": "middle",
                "text-anchor": "middle"
            });
        }
         
        return t;
    }
}