import { App } from './GameManager';

export class CheatingDetector {
	private inView: boolean = false;

	constructor() {}

	public registerHandlers() {
		console.log('Registering Cheating Detector');

		window.addEventListener('focus', (ev) => this.onVisibilityChange(ev));
		window.addEventListener('blur', (ev) => this.onVisibilityChange(ev));
		window.addEventListener('pageshow', (ev) => this.onVisibilityChange(ev));
		window.addEventListener('pagehide', (ev) => this.onVisibilityChange(ev));
	}

	private onVisibilityChange(ev: Event) {
		if (['focus', 'pageshow'].includes(ev.type)) {
			if (this.inView) {
				return;
			}
			this.handleVisibilityChange(true);
			this.inView = true;
		} else if (this.inView) {
			this.handleVisibilityChange(false);
			this.inView = false;
		}
	}

	private handleVisibilityChange(visible: boolean) {
		const d = new Date();
		const n = d.toLocaleTimeString();

		App.getInstance().Socket.emit('REPORT_VISIBILITY_CHANGED', visible);
	}
}
