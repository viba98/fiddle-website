export {}; // Make this a module

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      getFiberRoots: (id: number) => any;
    };
  }
}

if (typeof window !== 'undefined') {
  console.log('Fiddle DevTools initializing...');
  
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook) {
    // Get the root fiber
    const fiber = hook.getFiberRoots(1).values().next().value;
    console.log('Root fiber found:', !!fiber);

    // Generic component finder
    const findComponent = (fiber: any, componentName: string): any => {
      if (!fiber) return null;

      if (fiber.elementType?.name === componentName) {
        console.log('Found component:', componentName, {
          props: fiber.memoizedProps,
          state: fiber.memoizedState
        });
        return fiber;
      }

      // Traverse children and siblings
      return findComponent(fiber.child, componentName) || 
             findComponent(fiber.sibling, componentName);
    };

    // Function to find and modify a hook's state
    const modifyHookState = (component: any, hookIndex: number, newValue: any) => {
      let currentHook = component.memoizedState;
      let index = 0;

      while (currentHook && index < hookIndex) {
        currentHook = currentHook.next;
        index++;
      }

      if (currentHook?.queue?.dispatch) {
        console.log('Found hook at index:', index, 'current value:', currentHook.memoizedState);
        currentHook.queue.dispatch(() => newValue);
        return true;
      }
      return false;
    };

    // Listen for messages to find/modify components
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'FIND_COMPONENT') {
        const component = findComponent(fiber.current, event.data.componentName);
        if (component) {
          window.parent.postMessage({
            type: 'COMPONENT_FOUND',
            data: {
              props: component.memoizedProps,
              hasState: !!component.memoizedState
            }
          }, '*');
        }
      }
      
      if (event.data?.type === 'MODIFY_HOOK') {
        const component = findComponent(fiber.current, event.data.componentName);
        if (component) {
          const success = modifyHookState(component, event.data.hookIndex, event.data.value);
          console.log('Hook modification:', success ? 'succeeded' : 'failed');
        }
      }
    });
  }
}