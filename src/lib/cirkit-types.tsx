
type ComponentTrait = 'list'|'set'|'item';

type Dict = { [key: string]: any };
type ComponentBase = Dict & { span?: number; path?: string, data?: Dict };
type ComponentTagged = ComponentBase & { tag: string; kind?: never; };
type ComponentTemplate = ComponentTagged;

type Component = ComponentBase | ComponentBase & { kind: string; tag?: never; };
type CollectionComponent = Component & { trait: ComponentTrait, template: Component, }
type ComponentMap = { [key: string]: Component | ComponentTagged | CollectionComponent };

type IndexedItem = { index: number, item: any };

export { Dict, ComponentMap, ComponentBase, ComponentTagged, Component, CollectionComponent, ComponentTemplate, IndexedItem};
