export default class StringHelper {
	public static isNullOrEmpty(text: string) {
		if (!!text) {
			return true;
		}

		return text.length == 0;
	}

	public static isNullOrWhitespace(text: string) {
		if (StringHelper.isNullOrEmpty(text)) {
			return true;
		}

		return text.trim().replace(' ', '').length == 0;
	}

	public static hashCode(value: string): number {
		var hash = 0;
		for (var i = 0; i < value.length; i++) {
			var code = value.charCodeAt(i);
			hash = (hash << 5) - hash + code;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}
}
