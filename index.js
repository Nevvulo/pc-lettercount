const Plugin = require('powercord/Plugin');
const { inject: pcInject } = require('powercord/injector');
const { waitFor, getOwnerInstance, createElement } = require('powercord/util');
const { getModule, constants } = require('powercord/webpack');
const { resolve } = require('path');

module.exports = class LetterCount extends Plugin {
  async start () {
    this.loadCSS(resolve(__dirname, 'style.scss'));
    await waitFor('.channelTextArea-rNsIhG');

    const updateInstance = () =>
      (this.instance = getOwnerInstance(document.querySelector('.channelTextArea-rNsIhG')));
    const instancePrototype = Object.getPrototypeOf(updateInstance());
    updateInstance();

    const inject = () => {
      const textarea = document.getElementsByClassName('channelTextArea-rNsIhG')[0];
      textarea._originalInnerHTML = textarea.innerHTML;
      const elm = createElement('div', {
        className: 'powercord-lettercount'
      });
      textarea.parentNode.prepend(elm);
      elm.append(
        createElement('div', {
          className: 'powercord-lettercount-value',
          innerHTML: `${this.instance.props.value.length || 0}`
        })
      );
      elm.append(
        createElement('div', {
          className: 'powercord-lettercount-maxvalue',
          innerHTML: '/ 2000'
        })
      );
    };

    const update = () => {
      updateInstance();
      const len = this.instance.props.value.length;
      if (len > 2000) {
        getModule([ 'ComponentDispatch' ]).ComponentDispatch.dispatch(constants.ComponentActions.SHAKE_APP, {
          duration: 100,
          intensity: 3
        });
        document.getElementsByClassName('powercord-lettercount')[0].classList.add('powercord-lettercount-error');
      } else {
        document.getElementsByClassName('powercord-lettercount')[0].classList.remove('powercord-lettercount-error');
      }
      document.getElementsByClassName('powercord-lettercount-value')[0].innerHTML = len;
    };

    inject();
    pcInject('pc-lettercount-mount', instancePrototype, 'componentDidMount', () => {
      const old = this.instance;
      updateInstance();
      if (old.props.channel.id !== this.instance.props.channel.id) {
        inject();
      }
    });

    await waitFor('.powercord-lettercount');
    pcInject('pc-lettercount', instancePrototype, 'handleKeyDown', async () => {
      update();
    });
  }

  unload () {
    this.unloadCSS();
    Array.from(document.querySelectorAll('.powercord-lettercount')).map(c => c.parentNode).forEach(c => {
      c.innerHTML = c._originalInnerHTML;
    });
  }
};
