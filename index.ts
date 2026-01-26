import { registerWidgetTaskHandler } from 'react-native-android-widget';

registerWidgetTaskHandler(async (props) => {
    const {clickAction} = props;
switch(props.widgetAction){
    case 'WIDGET_CLICK':
    if (clickAction === 'OPEN_MAIN') {
      // Do stuff when primitive with `clickAction="MY_ACTION"` is clicked
      // props.clickActionData === { id: 0 }
    }
     if (clickAction === 'OPEN_INPUT') {
      // Do stuff when primitive with `clickAction="MY_ACTION"` is clicked
      // props.clickActionData === { id: 0 }
    }
    break;
     default:
      break;
}
 
  


});