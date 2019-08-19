import { Component, h, Host, Prop, Method, State, Watch, Listen } from '@stencil/core';


@Component({
    tag: 'bottom-sheet-screen',
    styleUrl: 'bottom-sheet-screen.css',
    shadow: true
})
export class BottomSheetScreen {

    @State() enabled: boolean = false;

    @Prop() connectedBottomSheet: HTMLBottomSheetElement;
    @Watch('connectedBottomSheet')
    connectedBottomSheetChanged() {
        const { connectedBottomSheet } = this;
        console.log('connectedBottomSheet changed to ', connectedBottomSheet);
    }

    componentDidLoad() {
        this.connectedBottomSheetChanged();
    }

    @Prop() progress: number = 0;
    
    @Watch('progress')
    progressChanged() {
        this.enabled = this.progress > 0;
        console.log(this.enabled, this.progress);
    }

    @Method()
    enable() {
        this.enabled = true;
    }

    @Method()
    disable() {
        this.enabled = false;
    }

    @Listen('click')
    protected clickHandler() {
        this.connectedBottomSheet.close();
    }

    render() {
        return <Host style={{
            pointerEvents: this.enabled ? `all` : `none`,
            opacity: `${this.progress}`
        }} />
    }
}
