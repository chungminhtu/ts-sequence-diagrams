import { Signal } from "../model/Signal";
import { SignalElement, ActorElement, LineType, ActorRect, SignalType } from "./model";
import Actor from "../model/Actor";
import { ShapesGenerator, TextOption, LineOption } from "./ShapesGenerator";

const ACTOR_RECT_WIDTH = 100;
const ACTOR_RECT_HEIGHT = 50;

const SIGNAL_SELF_WIDTH = 25;
const SIGNAL_SELF_HEIGHT = 50;
const SIGNAL_SELF_TEXT_OFFSET_X = SIGNAL_SELF_WIDTH + 5;
const SIGNAL_SELF_TEXT_OFFSET_Y = SIGNAL_SELF_HEIGHT / 2;

const SIGNAL_TEXT_OFFSET_X = 5;
const SIGNAL_TEXT_OFFSET_Y = 5;

const SIGNAL_CREATION_WIDTH = 100;

/**
 * Generates sequence diagrams items: Actor, Signal, Note, ...
 */
export default class ItemsGenerator {

    shapesGenerator: ShapesGenerator;

    constructor(container: SVGElement) {
        this.shapesGenerator = new ShapesGenerator(container);
    }
    
    drawSignal(signal: Signal, offsetY: number,
                actorElA: ActorElement, actorElB: ActorElement,
                actorElACreatedBySignal: ActorElement, actorElBCreatedBySignal: ActorElement
    ): SignalElement {

        let signalElement = null;
        const classicActors = actorElA && actorElB;
        const signalToSelf = signal.toSameActor();

        if(signalToSelf) {
            signalElement = this._drawSelfSignal(signal, offsetY, actorElA);
        }
        else if(classicActors) {
            signalElement = this._drawSignalFromAToB(signal, actorElA, actorElB, offsetY);
        } 
        else if(actorElACreatedBySignal && actorElBCreatedBySignal) {
            signalElement = this._drawSignalFromAToB(signal, actorElACreatedBySignal, actorElBCreatedBySignal, offsetY);
        }
        else if(actorElACreatedBySignal) {
            signalElement = this._drawSignalFromAToB(signal, actorElACreatedBySignal, actorElB, offsetY);
        }
        else if(actorElBCreatedBySignal) {
            signalElement = this._drawSignalFromAToB(signal, actorElA, actorElBCreatedBySignal, offsetY);
        }

        return signalElement;
    }

    drawActor(actor: Actor, x: number, y: number): ActorElement {
        // Draw rectangle
        const rect = this.shapesGenerator.drawRect(x, y, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        var textX = (ACTOR_RECT_WIDTH / 2) + x;
        var textY = ACTOR_RECT_HEIGHT / 2;
        const text = this.shapesGenerator.drawText(textX, textY, actor.name, [TextOption.CENTERED]);

        return new ActorElement(actor, new ActorRect(rect, text));
    }

    drawActorLines(actorsElements: ActorElement[], destroyedActors: Actor[], offsetY: number): void {
        for(const i in actorsElements) {
            const actorEl = actorsElements[i];
            const actorName = actorEl.actor.name;

            const alreadyDestroyed = destroyedActors.filter(a => a.name === actorName).pop();

            if(!alreadyDestroyed) {
                const [line, actorBottomRect] = this._drawLivingActorLineAndRect(actorEl, actorName, offsetY);
                actorEl.line = line;
                actorEl.bottomRect = actorBottomRect;
            }
        }
    }

    moveActor(actor: ActorElement, actorsBefore: ActorElement[], actorsAfter: ActorElement[], offsetX: number): void {
        console.log(`Actor to move '${actor.actor.name}', with ${actorsBefore.length} before actors and ${actorsAfter.length} after actors`);

        // Move actor
        this._moveActor(actor, offsetX);
        this._moveIncomingSignals(actor, offsetX);
        this._moveOutgoingSignals(actor, offsetX);
        
        // Move actors-after
        actorsAfter.forEach(actorAfter => {
            this._moveActor(actorAfter, offsetX);
        });

        // signals from actors-before that have signals that goes to actors-after but not to actor
        const signalsToExtend: SignalElement[] = []; 
        actorsBefore.forEach(actorBefore => {

            console.log(`Actor Bypass Before - ${actorBefore.actor.name}`);

            actorBefore.incomingSignals.filter(inSignal => {

                if(inSignal.actorA.actor.name !== actor.actor.name) {
                    signalsToExtend.push(inSignal);
                }
            });

            actorBefore.outgoingSignals.filter(inSignal => {

                if(inSignal.actorB.actor.name !== actor.actor.name) {
                    signalsToExtend.push(inSignal);
                }
            });
        });

        signalsToExtend.forEach(signal => {

            // Extend line
            const x1 = signal.line.getBBox().x;
            const x2 = signal.line.getBBox().x2 + offsetX;
            this.shapesGenerator.extendElement(signal.line, x1, x2);

            // Move text of incoming signals to the actorA line
            if(signal.lineType === LineType.RESPONSE) {
                this.shapesGenerator.translateElement(signal.text, offsetX);
            }
        });
    }

    _moveActor(actorEl: ActorElement, offsetX: number): void {

        console.log(`Moving Actor '${actorEl.actor.name}' ${offsetX}px to the right`);

        const elementsToMove = [
            actorEl.topRect.rect,
            actorEl.topRect.text,
            actorEl.line
        ];

        actorEl.selfSignals.forEach(selfSignal => {
            elementsToMove.push(...selfSignal.lines);
            elementsToMove.push(selfSignal.text);
        });

        if(actorEl.bottomRect) {
            elementsToMove.push(actorEl.bottomRect.rect);
            elementsToMove.push(actorEl.bottomRect.text);
        }

        this.shapesGenerator.translateElements(elementsToMove, offsetX);
    }

    _moveIncomingSignals(actorEl: ActorElement, offsetX: number) : void {
        /*
         * Extend Actor incoming signals
         */
        actorEl.incomingSignals.forEach(signalEl => {
            if(signalEl.lineType === LineType.REQUEST) {
                const x1 = signalEl.line.getBBox().x;
                const x2 = signalEl.line.getBBox().x2 + offsetX;
                this.shapesGenerator.extendElement(signalEl.line, x1, x2);
            } 
            else if(signalEl.lineType === LineType.RESPONSE) {
                const x1 = signalEl.line.getBBox().x + offsetX;
                const x2 = signalEl.line.getBBox().x2 + offsetX;
                this.shapesGenerator.extendElement(signalEl.line, x1, x2);
                this.shapesGenerator.translateElement(signalEl.text, offsetX);
            }
        });
    }

    _moveOutgoingSignals(actorEl: ActorElement, offsetX: number) : void {
        /*
         * Extend Actor outgoing signals
         */
        actorEl.outgoingSignals.forEach(signalEl => {
            if(signalEl.lineType === LineType.REQUEST) {
                const x1 = signalEl.line.getBBox().x + offsetX;
                const x2 = signalEl.line.getBBox().x2 + offsetX;
                this.shapesGenerator.extendElement(signalEl.line, x1, x2);
                this.shapesGenerator.translateElement(signalEl.text, offsetX);
            } 
            else if(signalEl.lineType === LineType.RESPONSE) {
                const x1 = signalEl.line.getBBox().x;
                const x2 = signalEl.line.getBBox().x2 + offsetX;
                this.shapesGenerator.extendElement(signalEl.line, x1, x2);
                this.shapesGenerator.translateElement(signalEl.text, offsetX);
            }
        });
    }

    _drawActorCreatedBySignal(signal: Signal, x: number, y: number, offsetY: number): ActorElement {
        // Draw rectangle
        const rect = this.shapesGenerator.drawRect(x, y, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        const textX = (ACTOR_RECT_WIDTH / 2) + x;
        const textY = (ACTOR_RECT_HEIGHT / 2) + y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.actorB.name, [TextOption.CENTERED]);

        return new ActorElement(signal.actorB, new ActorRect(rect, text));
    }

    _drawSignalFromAToB(signal: Signal, actorElA: ActorElement, actorElB: ActorElement, offsetY: number): SignalElement {

        // Determine whether the signal goes backward of forward
        let signalGoingForward;

        // Based on that, compute the line x1 and x2 to always have x1 < x2 (thus every line will start from the left and go to the right)
        let lineX1;
        let lineX2;
        if(actorElA.topRect.rect.getBBox().x < actorElB.topRect.rect.getBBox().x) {
            signalGoingForward = true;
            lineX1 = (actorElA.topRect.rect.getBBox().width / 2) + actorElA.topRect.rect.getBBox().x;
            lineX2 = (actorElB.topRect.rect.getBBox().width / 2) + actorElB.topRect.rect.getBBox().x;
        } else {
            signalGoingForward = false;
            lineX1 = (actorElB.topRect.rect.getBBox().width / 2) + actorElB.topRect.rect.getBBox().x;
            lineX2 = (actorElA.topRect.rect.getBBox().width / 2) + actorElA.topRect.rect.getBBox().x;
        }

        // Draw Signal line
        const lineY = actorElA.topRect.rect.getBBox().h + offsetY;
        const dottedLine = signal.lineType === LineType.RESPONSE;

        const options = [];
        
        if(signalGoingForward) {
            options.push(LineOption.END_MARKER);
        } else {
            options.push(LineOption.START_MARKER);
        }

        if(dottedLine) {
            options.push(LineOption.DOTTED);
        }

        const line = this.shapesGenerator.drawLine(lineX1, lineX2, lineY, lineY, options);

        if(signalGoingForward) {
            // Draw Signal text
            const textX = lineX1 + SIGNAL_TEXT_OFFSET_X;
            const textY = lineY - SIGNAL_TEXT_OFFSET_Y;
            const text = this.shapesGenerator.drawText(textX, textY, signal.message);

            return SignalElement.forward(line, signal.lineType, signal.type, text, actorElA, actorElB);
        } else {
            // First, draw the text
            let textX = lineX2 - SIGNAL_TEXT_OFFSET_X;
            const textY = lineY - SIGNAL_TEXT_OFFSET_Y;
            let text = this.shapesGenerator.drawText(textX, textY, signal.message);
            
            // Get its width so it can be moved right
            const textWidth = text.getBBox().w;

            // Remove the current text
            text.remove();

            // And create a new one that will be correctly placed
            textX = textX - textWidth;
            text = this.shapesGenerator.drawText(textX, textY, signal.message);

            return SignalElement.forward(line, signal.lineType, signal.type, text, actorElA, actorElB);
        }
    }

    _drawSelfSignal(signal: Signal, offsetY: number, actorElA: ActorElement): SignalElement {

        // Draw self signal (3 lines)
        const x1 = (actorElA.topRect.rect.getBBox().width / 2) + actorElA.topRect.rect.getBBox().x;
        const x2 = x1 + SIGNAL_SELF_WIDTH;
        const y1 = actorElA.topRect.rect.getBBox().h + offsetY;
        const y2 = y1 + SIGNAL_SELF_HEIGHT;
        
        const line1 = this.shapesGenerator.drawLine(x1, x2, y1, y1);
        const line2 = this.shapesGenerator.drawLine(x2, x2, y1, y2);
        const line3 = this.shapesGenerator.drawLine(x2, x1, y2, y2, [LineOption.END_MARKER]);
        
        const lines = [line1, line2, line3];
        
        // Draw text
        const textX = x1 + SIGNAL_SELF_TEXT_OFFSET_X;
        const textY = y1 + SIGNAL_SELF_TEXT_OFFSET_Y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.message);

        return SignalElement.self(lines, signal.lineType, text, actorElA);
    }

    drawSignalAndActor(signal: Signal, actorElA: ActorElement, offsetY: number) : [SignalElement, ActorElement] {

        // Draw line to Actor rect
        const signalAX = (actorElA.topRect.rect.getBBox().width / 2) + actorElA.topRect.rect.getBBox().x;
        const signalBX = signalAX + SIGNAL_CREATION_WIDTH;
        const signalY = actorElA.topRect.rect.getBBox().h + offsetY;

        const options = [LineOption.END_MARKER];
        const line = this.shapesGenerator.drawLine(signalAX, signalBX, signalY, signalY, options);

        // Draw text
        const textX = signalAX + SIGNAL_TEXT_OFFSET_X;
        const textY = signalY - SIGNAL_TEXT_OFFSET_Y;
        const text = this.shapesGenerator.drawText(textX, textY, signal.message);

        // Draw Actor rect
        const rectX = signalBX;
        const rectY = signalY - (ACTOR_RECT_HEIGHT / 2);
        const actorElB = this._drawActorCreatedBySignal(signal, rectX, rectY, offsetY);
        
        const signalEl = SignalElement.forward(line, LineType.REQUEST, SignalType.ACTOR_CREATION, text, actorElA, actorElB);

        return [signalEl, actorElB];
    }

    destroyActor(actorEl: ActorElement, offsetY: number): void {
        // Draw actor line
        const x = actorEl.topRect.rect.getBBox().x + (ACTOR_RECT_WIDTH / 2);
        const y1 = actorEl.topRect.rect.getBBox().y + ACTOR_RECT_HEIGHT;
        const y2 = ACTOR_RECT_HEIGHT + offsetY;

        const line = this.shapesGenerator.drawLine(x, x, y1, y2);

        // Draw cross
        const cross =this.shapesGenerator.drawCross(x, y2);
    }

    _drawLivingActorLineAndRect(actorElement: ActorElement, actorName: string, offsetY: number): [Snap.Element, ActorRect] {
        // Draw whole line
        const lineX = actorElement.topRect.rect.getBBox().x + (ACTOR_RECT_WIDTH / 2);
        const lineY1 = actorElement.topRect.rect.getBBox().y + ACTOR_RECT_HEIGHT;
        const lineY2 = offsetY + ACTOR_RECT_HEIGHT;
        const line = this.shapesGenerator.drawLine(lineX, lineX, lineY1, lineY2);

        // Draw bottom actor rect
        const rectX = lineX - (ACTOR_RECT_WIDTH / 2);
        const rectY = lineY2;
        const rect = this.shapesGenerator.drawRect(rectX, rectY, ACTOR_RECT_WIDTH, ACTOR_RECT_HEIGHT);

        // Draw text inside rectangle
        const textX = (ACTOR_RECT_WIDTH / 2) + rectX;
        const textY = (ACTOR_RECT_HEIGHT / 2) + lineY2;
        const text = this.shapesGenerator.drawText(textX, textY, actorName, [TextOption.CENTERED]);

        return [line, new ActorRect(rect, text)];
    }
}