
type ComponentTrait = 'list'|'set';

type Dict = { [key: string]: any };
type ComponentBase = Dict & { span?: number; };
type ComponentTagged = ComponentBase & { tag: string; kind?: never; };
type ComponentTemplate = ComponentTagged;

type Component = ComponentBase & { kind: string; tag?: never; };
type CollectionComponent = Component & { trait: ComponentTrait, template: Component, }
type ComponentMap = { [key: string]: Component | ComponentTagged | CollectionComponent };


export { Dict, ComponentMap, ComponentBase, ComponentTagged, Component, CollectionComponent, ComponentTemplate};
