import {LayoutRegistry} from './citkit-core';

const Name = 'Flex'

type FlexDirection = 'VBox' | 'HBox';
type TFlexParams = {
  direction?: FlexDirection;
  spans?: number[];
}

const Layout = (params: TFlexParams, container: HTMLElement) => {
  const { spans = [], direction = 'VBox' } = params;

  const children = container.children;
  if (children.length > spans.length) {
    throw new Error(`More DOM children (${children.length}) than span entries (${spans.length})`);
  }

  for (let i = 0; i < children.length; i++) {
    (children[i] as HTMLElement).style.flexGrow = String(spans[i] ?? 1);
  }

  container.classList.remove('HBox');
  container.classList.remove('VBox');
  container.classList.add(direction);
}

LayoutRegistry[Name] = Layout;


export const FlexLayout = (direction = 'VBox', spans: number[] = []) => ({[Name]: {direction: direction, spans: spans}});
