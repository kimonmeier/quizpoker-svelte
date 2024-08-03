export class ArrayUtils {
	public static shuffleArray<T>(array: T[]): T[] {
		let currentIndex = array.length,
			randomIndex;

		// While there remain elements to shuffle...
		while (currentIndex != 0) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}

		return array;
	}

	public static sumField<T>(array: T[], field: keyof T): number {
		return array.reduce((total, player) => total + (player[field] as number), 0);
	}
}
