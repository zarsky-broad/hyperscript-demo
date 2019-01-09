import * as h from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'


const styles = {
  formLabel: {
    ...Style.elements.sectionHeader,
    margin: '1rem 0 0.25rem'
  },
  formHint: {
    fontSize: 'smaller',
    marginTop: '0.25rem'
  }
}


export const formLabel = (text, ...extras) => {
  return h.div({ style: styles.formLabel }, [
    text,
    ...extras
  ])
}


export const requiredFormLabel = (text, ...extras) => {
  return h.div({ style: styles.formLabel }, [
    `${text} *`,
    ...extras
  ])
}


export const formHint = text => {
  return h.div({ style: styles.formHint }, [text])
}
