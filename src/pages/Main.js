import { hot } from 'react-hot-loader'
import * as h from 'react-hyperscript-helpers'
import Router from 'src/components/Router'


const Main = () => {
  return h.h(Router)
}

export default hot(module)(Main)
