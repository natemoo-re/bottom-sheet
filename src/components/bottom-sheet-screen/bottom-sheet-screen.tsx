import {Component, h, Host, Prop, Method, State, Watch, Listen, EventEmitter, Event} from '@stencil/core';

@Component({
    tag: 'bottom-sheet-screen',
    styleUrl: 'bottom-sheet-screen.css',
    shadow: true
})
export class BottomSheetScreen {

    @State() enabled: boolean = false;

    @Prop() progress: number = 0;

    @Event() closeBottomSheet: EventEmitter<void>;

    @Watch('progress')
    progressChanged() {
        this.enabled = this.progress > 0;
        console.log(this.enabled, this.progress);
    }

    @Method()
    async enable() {
        this.enabled = true;
    }

    @Method()
    async disable() {
        this.enabled = false;
    }

    @Listen('click')
    protected clickHandler() {
      this.closeBottomSheet.emit();
    }

    render() {
        return <Host style={{
            pointerEvents: this.enabled ? `all` : `none`,
            opacity: `${this.progress}`
        }} />
    }
}
