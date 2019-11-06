import { Component, h, Host, Prop, Listen, State, Watch, Method, Element } from '@stencil/core';
import { styler, inertia, listen, pointer, value, calc, ValueReaction, Action, tween, TweenProps } from 'popmotion';
import { Styler } from 'stylefire';
import { HotSubscription } from 'popmotion/lib/reactions/types';
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock/lib/bodyScrollLock.es6.js';
import { cubicBezier } from '@popmotion/easing';

const mix = calc.getValueFromProgress;


@Component({
    tag: 'bottom-sheet',
    styleUrl: 'bottom-sheet.css',
    shadow: true
})
export class BottomSheet {

    @Element() element: HTMLBottomSheetElement;

    private subscriptions: HotSubscription[] = [];
    private containerEl: HTMLDivElement;

    private sheetEl: HTMLDivElement;
    private sheetStyler: Styler;

    @State() dragging: boolean = false;
    @Watch('dragging')
    draggingChanged() {
        const action = this.dragging ? disableBodyScroll : enableBodyScroll;
        action(this.containerEl);
    }

    @State() progress: number = 0;

    @Prop() arrow: boolean = false;
    @Prop() initialPosition: 'top' | 'bottom' = 'bottom';

    private async animateSheet(to: number, tweenProps: TweenProps): Promise<void> {
        const target = this.sheetY;
        const from = target.get();
        if (from === to) return Promise.resolve();

        return new Promise((resolve) => {
            const opts: TweenProps = { from, to, ...tweenProps };
            const sub = this.sheetY.subscribe((v) => {
                if (v === opts.to) {
                    resolve();
                    sub.unsubscribe();
                    return;
                }
            });
            tween(opts).start(target);
        })
    }

    @Method()
    async open() {
        return this.animateSheet(0, { ease: cubicBezier(0.23, 1, 0.320, 1) })
    }

    @Method()
    async close() {
        return this.animateSheet(this.boundaryHeight, { ease: cubicBezier(0.23, 1, 0.320, 1) })
    }

    private onValueChange = (v: number) => {
        this.progress = 1 - (v / this.boundaryHeight);
    }

    // private getCurrentAction = () => this.dragging ? this.pointer : this.intertia;

    private pointer: Action;
    private intertia: Action;
    private sheetY: ValueReaction;

    componentDidLoad() {
        this.setBoundariesHeight();
        this.sheetStyler = styler(this.sheetEl);

        const initialY = (this.initialPosition === 'bottom') ? this.boundaryHeight : 0;
        this.sheetY = value(initialY, v => this.sheetStyler.set('y', v));

        this.subscriptions = [...this.subscriptions, this.sheetY.subscribe(this.onValueChange)];

        listen(this.sheetEl, 'mousedown touchstart').start(() => {
            this.dragging = true;

            const max = this.boundaryHeight;
            const tug = 0.2;

          const applyOverdrag = v => {
                if (v < 0) return mix(0, v, tug)
                if (v > max) return mix(max, v, tug)
                return v
            }

          this.pointer = pointer({ y: this.sheetY.get() as any })
            .pipe(({ y }) => y, applyOverdrag);
            this.pointer.start(this.sheetY)
        })

        listen(document, 'mouseup touchend').start(() => {
            this.dragging = false;

            this.intertia = inertia({
                min: 0,
                max: this.boundaryHeight,
                from: this.sheetY.get(),
                velocity: this.sheetY.getVelocity(),
                power: 0.2,
                bounceStiffness: 400,
                bounceDamping: 22.5
            });
            this.intertia.start(this.sheetY);
        })
    }

    componentDidUnload() {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe()
        }
        this.subscriptions = undefined;
        clearAllBodyScrollLocks();
    }

    private boundaryHeight: number = 0;

    @Listen('resize', { target: 'window' })
    protected resizeHandler() {
        this.setBoundariesHeight();
    }

    private setBoundariesHeight = () => {
        this.boundaryHeight = this.containerEl.getBoundingClientRect().height - this.sheetEl.getBoundingClientRect().height;
    }

    render() {
        return (
            <Host class={{
                'is-dragging': this.dragging,
                'is-closed': this.progress <= 0.09,
                'is-open': this.progress >= 0.99
            }}
                style={{
                    '--progress': `${this.progress}`
                }}>
                {this.renderBackdrop()}
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
            </Host>
        );
    }

    private renderBackdrop() {
      return <bottom-sheet-screen progress={this.progress} onCloseBottomSheet={() => this.close()}></bottom-sheet-screen>;
    }
}
