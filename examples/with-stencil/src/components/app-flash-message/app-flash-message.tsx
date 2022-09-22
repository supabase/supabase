/**
 * Component for showing flash messages.
 *
 * @component AppFlashMessage
 */

import { Component, h, Prop, Watch } from '@stencil/core';

@Component({
  tag: 'app-flash-message',
  styleUrl: 'app-flash-message.scss',
})
export class AppFlashMessage {
  /**
   * Message type
   */
  @Prop() type: string = '';

  /**
   * alert closable.
   */
  @Prop() closable: boolean = true;

  /**
   * Show/hide alert message
   */
  @Prop({ mutable: true, reflect: true }) show = true;

  @Watch('show')
  handleShowChange() {
    if (this.show === false) {
      this.hideMessage();
    } else {
      this.showMessage();
    }
  }

  /**
   * Hide message
   *
   * @returns {(null | void)}
   */
  async hideMessage() {
    if (!this.show) {
      return null;
    }
    this.show = false;
  }

  /**
   * Show message
   *
   * @returns {(null | void)}
   */
  async showMessage() {
    if (this.show) {
      return null;
    }
    this.show = true;
  }

  componentDidLoad() {
    // Show on init if open
    if (this.show) {
      this.showMessage();
    }
  }

  /**
   * Render component <app-flash-message>
   *
   * @returns {void}
   */
  render() {
    return (
      <div
        class={{
          'app-alert': true,
          'success': this.type === 'success',
          'hidden': this.show == false,
        }}
        role="alert"
        aria-hidden={this.show == false ? true : false}
      >
        {this.closable && (
          <span class="app-close-btn" onClick={() => this.hideMessage()}>
            &times;
          </span>
        )}
        <slot></slot>
      </div>
    );
  }
}
