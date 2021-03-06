import {Svg, Element, Text, Marker, Rect, Line} from "@svgdotjs/svg.js";
import { CrossElement, LineOption, TextOption, Dimensions, RectOption } from './model';

/**
 * Generates basic items: rect, text, lines, ...
 */
export class ShapesGenerator {
    
    readonly paper: Svg;
    readonly startMarker: Marker;
    readonly endMarker: Marker;

    constructor(container: HTMLElement) {
        this.paper = new Svg().addTo(container);
        this.startMarker = this.paper.marker(5, 5, (add) => {
            add.path('M 0 2.5   L 5 5   L 5 0   z');
            add.ref(0, 2.5);
        });
        this.endMarker = this.paper.marker(5, 5, (add) => {
            add.path('M 0 0   L 5 2.5   L 0 5   z');
            add.ref(5, 2.5);
        });
    }

    drawLine(x1: number, x2: number, y1: number, y2: number, options?: LineOption[]): Line {

        const line = this.paper.line(x1, y1, x2, y2);
        line.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        if(options && options.includes(LineOption.START_MARKER)) {
            line.marker('start', this.startMarker);
        }
        
        if(options && options.includes(LineOption.END_MARKER)) {
            line.marker('end', this.endMarker);
        }

        if(options && options.includes(LineOption.DOTTED)) {
            line.attr({
                "stroke-dasharray": "5,5"
            });
        }

        return line;
    }

    drawRect(x: number, y: number, w: number, h: number, options?: RectOption[]): Rect {

        const rect = this.paper.rect(w, h).move(x, y);
        
        rect.attr({
            'stroke': 'black',
            'fill': 'none'
        });
        

        if(options && options.includes(RectOption.DOTTED)) {
            rect.attr({
                "stroke-dasharray": "20,5"
            });
        } 

        if(options && options.includes(RectOption.THIN)) {
            rect.attr({
                'stroke-width': 1,
            });
        } else {
            rect.attr({
                'stroke-width': 2,
            });
        }
        
        return rect;
        
    }

    drawText(x: number | string , y: number, text: string, options?: TextOption[]): Text {
        
        var t = this.paper.plain(text).attr({ x: x, y: y });

        if(options && options.includes(TextOption.CENTERED)) {
            t.attr({
                "dominant-baseline": "middle",
                "text-anchor": "middle"
            });
        }

        if(options && options.includes(TextOption.TITLE)) {
            t.attr({
                "font-size": 20
            });
        }
        else if(options && options.includes(TextOption.SMALL)) {
            t.attr({
                "font-size": 12
            });
        }
         
        return t;
    }

    drawCross(x: number, y: number): CrossElement {

        const x1 = x - (Dimensions.CROSS_WIDTH / 2);
        const x2 = x + (Dimensions.CROSS_WIDTH / 2);
        const y1 = y - (Dimensions.CROSS_WIDTH / 2);
        const y2 = y + (Dimensions.CROSS_WIDTH / 2);

        const line1 = this.paper.line(x1, y1, x2, y2);
        line1.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        const line2 = this.paper.line(x1, y2, x2, y1);
        line2.attr({
            "stroke": "black",
            "stroke-width": 2
        });

        return new CrossElement(line1, line2);
    }
}