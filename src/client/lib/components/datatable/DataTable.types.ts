export enum ConfigType {
	Data,
	Button
}

interface DataTableRowConfig<T extends { id: string }> {
	column: keyof T;
	type: ConfigType.Data;
	title: string;
	class?: string;
}

interface DataTableButtonConfig<T extends { id: string }> {
	title: string;
	type: ConfigType.Button;
	class?: string;
	value: string;
	onClick: (data: T) => void;
}

export type DataTableConfig<T extends { id: string }> =
	| DataTableRowConfig<T>
	| DataTableButtonConfig<T>;
