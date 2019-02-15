import { Component, Prop, Listen, State } from '@stencil/core';
import { styler, inertia, listen, pointer, value, calc } from 'popmotion';
import { Styler } from 'stylefire';
import { HotSubscription } from 'popmotion/lib/reactions/types';

const mix = calc.getValueFromProgress;


@Component({
    tag: 'bottom-sheet',
    styleUrl: 'bottom-sheet.css',
    shadow: true
})
export class BottomSheet {

    private subscriptions: HotSubscription[] = [];
    private containerEl: HTMLDivElement;
    
    private sheetEl: HTMLDivElement;
    private sheetStyler: Styler;

    @State() dragging: boolean = false;
    @State() progress: number = 0;

    @Prop() arrow: boolean = false;
    @Prop() initialPosition: 'top' | 'bottom' = 'bottom';
    
    private onValueChange = (v: number) => {
        this.progress = 1 - (v / this.boundaryHeight);
        // console.log(this.progress);
    }

    componentDidLoad() {
        this.setBoundariesHeight();
        this.sheetStyler = styler(this.sheetEl);

        const initialY = (this.initialPosition === 'bottom') ? this.boundaryHeight : 0;
        const sheetY = value(initialY, v => this.sheetStyler.set('y', v));
        
        this.subscriptions = [...this.subscriptions, sheetY.subscribe(this.onValueChange)];

        listen(this.sheetEl, 'mousedown touchstart').start(() => {
            this.dragging = true;
            const max = this.boundaryHeight;
            const tug = 0.2;
            
            const applyOverdrag = v => {
                if (v < 0) return mix(0, v, tug)
                if (v > max) return mix(max, v, tug)
                return v
            }

            pointer({ y: sheetY.get() as any })
                .pipe(({ y }) => y, applyOverdrag)
                .start(sheetY);
        })

        listen(document, 'mouseup touchend').start(() => {
            this.dragging = false;
            inertia({
                min: 0,
                max: this.boundaryHeight,
                from: sheetY.get(),
                velocity: sheetY.getVelocity(),
                power: 0.6,
                bounceStiffness: 400,
                bounceDamping: 22.5
            }).start(sheetY);
        })
    }

    componentDidUnload() {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe()
        }
        this.subscriptions = undefined;
    }

    private boundaryHeight: number = 0;

    @Listen('window:resize')
    protected resizeHandler() {
        console.log('resize');
        this.setBoundariesHeight();
    }

    private setBoundariesHeight = () => {
        this.boundaryHeight = this.containerEl.getBoundingClientRect().height - this.sheetEl.getBoundingClientRect().height;
    }

    hostData() {
        return {
            class: {
                'is-dragging': this.dragging,
                'is-closed': this.progress <= 0.09,
                'is-open': this.progress >= 0.99
            },
            style: {
                '--progress': `${this.progress}`
            }
        }
    }

    render() {
        return (
            <div class="container" ref={el => this.containerEl = el}>
                <div class="sheet" ref={el => this.sheetEl = el}>
                    <div class="sheet-header">
                        { this.arrow && <bottom-sheet-indicator /> }
                        <slot name="sheet-header" />
                    </div>
                    <div class="sheet-content">
                        <slot/>
                    </div>
                </div>
            </div>
        );
    }
}
