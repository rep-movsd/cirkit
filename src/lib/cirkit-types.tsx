
type ComponentTrait = 'list'|'set';

type Dict = { [key: string]: any };
type ComponentBase = Dict & { span?: number; data?: Dict };
type ComponentTagged = ComponentBase & { tag: string; kind?: never; };
type ComponentTemplate = ComponentTagged;

type Component = ComponentBase | ComponentBase & { kind: string; tag?: never; };
type CollectionComponent = Component & { trait: ComponentTrait, template: Component, }
type ComponentMap = { [key: string]: Component | ComponentTagged | CollectionComponent };

// Defines a function that is called to set one or more elements to a selected state, and the rest to unselected
type CollectionComponentSelector = (element: Component, selected: boolean) => void;

type IndexedItem = { index: number, item: any };

export { Dict, ComponentMap, ComponentBase, ComponentTagged, Component, CollectionComponent, ComponentTemplate, IndexedItem};
