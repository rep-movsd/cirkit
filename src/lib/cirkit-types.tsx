
type ComponentTrait = 'list'|'set'|'item';

type Dict = { [key: string]: any };
type Component = Dict & { span?: number; path?: string, data?: Dict, bind?: string, signals?: string[]};

type CollectionComponent = Component & { trait: ComponentTrait }
type ComponentMap = { [key: string]: Component | CollectionComponent };

type IndexedItem = { index: number, item: any };

export { Dict, ComponentMap, Component, CollectionComponent, IndexedItem};
