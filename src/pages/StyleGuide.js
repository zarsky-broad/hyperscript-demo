import _ from 'lodash/fp'
import * as h from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { buttonPrimary, buttonSecondary, Checkbox, link, RadioButton, search } from 'src/components/common'
import { icon } from 'src/components/icons'
import { textInput, validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { FlexTable, GridTable, HeaderCell, TextCell } from 'src/components/table'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const els = {
  section: (title, children) => h.div({
    style: {
      padding: '1.5rem', backgroundColor: 'white', margin: '1.5rem 0',
      overflowX: 'auto'
    }
  }, [
    h.div({ style: { fontSize: 25, marginBottom: '1rem', textTransform: 'uppercase' } }, [title]),
    ...children
  ]),
  columns: (children, style = {}) => h.div({
    style: { display: 'flex', justifyContent: 'space-between', ...style }
  }, children),
  fixWidth: (width, children) => h.div({ style: { display: 'inline-block', width } }, children),
  colorSwatch: (color, title, textColor = 'white') => h.div({
    style: {
      width: 91, height: 91, backgroundColor: color, color: textColor,
      padding: '0.25rem', display: 'inline-flex', flexDirection: 'column'
    }
  }, [
    h.div({ style: { flex: 1 } }),
    h.div({ style: { textTransform: 'uppercase' } }, [title]),
    h.div({ style: { fontSize: '75%' } }, [color])
  ]),
  colorWaterfall: (colorBase, title) => h.div({
    style: {
      display: 'flex', marginBottom: '0.5rem'
    }
  }, colorBase.map((color, index) => els.colorSwatch(
    color,
    index === 0 ? title : undefined,
    index >= 4 ? colorBase[0] : 'white'))
  ),
  buttonContainer: component => h.div({ style: { marginTop: '2rem' } }, [component])
}

class StyleGuide extends Component {
  constructor(props) {
    super(props)
    this.state = { validatedInputValue: 'Invalid input' }
  }

  render() {
    const { validatedInputValue } = this.state
    const errors = validate({ validatedInputValue }, { validatedInputValue: { email: true } })

    return h.div({ style: { width: 1164, margin: '4rem auto' } }, [
      h.div({ style: { display: 'flex', alignItems: 'center', marginBottom: '4rem' } }, [
        icon('logoIcon', { size: 210 }),
        h.span({
          style: {
            fontSize: 55, fontWeight: 700, color: colors.slate, letterSpacing: 1.78,
            marginLeft: '2rem'
          }
        }, [
          'DEMO STYLE GUIDE'
        ])
      ]),
      els.section('Color Styles', [
        els.columns([
          h.div([
            els.colorWaterfall(colors.blue, 'blue'),
            els.colorWaterfall(colors.darkBlue, 'dark blue'),
            els.colorWaterfall(colors.gray, 'gray'),
            els.colorWaterfall(colors.purple, 'purple')
          ]),
          h.div([
            els.colorWaterfall(colors.green, 'green'),
            els.colorWaterfall(colors.red, 'red'),
            els.colorWaterfall(colors.orange, 'orange'),
            els.colorSwatch(colors.slate, 'slate'),
            els.colorSwatch(colors.brick, 'brick')
          ])
        ])
      ]),
      els.section('Typeface', [
        h.div({ style: { display: 'flex', alignItems: 'center' } }, [
          h.div({ style: { paddingRight: '2rem', borderRight: Style.standardLine, marginRight: '2rem' } }, [
            h.div({ style: { fontSize: 78 } }, ['Montserrat']),
            els.columns([
              h.div([
                h.div({ style: { fontWeight: 400 } }, ['Montserrat 400']),
                h.div({ style: { fontWeight: 600 } }, ['Montserrat 600'])
              ]),
              h.div([
                h.div({ style: { fontWeight: 700 } }, ['Montserrat 700']),
                h.div({ style: { fontWeight: 800 } }, ['Montserrat 800'])
              ])
            ], { fontSize: 24, lineHeight: '42px' })
          ]),
          h.div({ style: { fontSize: 28, lineHeight: '42px' } }, [
            h.div(['ABCČĆDĐEFGHIJKLMNOPQRSŠTUVWXYZŽ']),
            h.div(['abcčćdđefghijklmnopqrsštuvwxyzž']),
            h.div(['ĂÂÊÔƠƯăâêôơư1234567890‘?’“!”']),
            h.div(['(%)[#]{@}/&\\<-+÷×=>®©$€£¥¢:;,.*'])
          ])
        ])
      ]),
      els.section('Buttons & Links', [
        h.div({ style: { display: 'flex' } }, [
          h.div({ style: { flex: 1 } }, [
            els.buttonContainer(buttonPrimary({}, ['Primary Button'])),
            els.buttonContainer(buttonSecondary({}, ['Secondary Button'])),
            els.buttonContainer(link({}, ['Text as a link']))
          ]),
          h.div({ style: { flex: 1 } }, [
            els.buttonContainer(buttonPrimary({ disabled: true }, ['Disabled button'])),
            els.buttonContainer(buttonSecondary({ disabled: true }, ['Disabled secondary']))
          ])
        ])
      ]),
      els.section('Search Box', [
        search({ inputProps: { placeholder: 'Search' } })
      ]),
      els.section('Text Box', [
        els.columns([
          els.fixWidth('30%', [textInput({ placeholder: 'Text box' })]),
          els.fixWidth('30%', [textInput({ defaultValue: 'Text box' })]),
          els.fixWidth('30%', [
            validatedInput({
              inputProps: {
                placeholder: 'ValidatedInput wants an email',
                value: validatedInputValue,
                onChange: e => this.setState({ validatedInputValue: e.target.value })
              },
              error: Utils.summarizeErrors(errors && errors.validatedInputValue)
            })
          ])
        ])
      ]),
      els.section('Checkmarks/Radio/Toggles', [
        els.fixWidth(40, [h.h(Checkbox, { checked: false })]),
        els.fixWidth(40, [h.h(Checkbox, { checked: true })]),
        els.fixWidth(40, [h.h(Checkbox, { checked: false, disabled: true })]),
        els.fixWidth(40, [h.h(Checkbox, { checked: true, disabled: true })]),
        els.fixWidth(40, [h.h(RadioButton, { checked: false, readOnly: true })]),
        els.fixWidth(40, [h.h(RadioButton, { checked: true, readOnly: true })])
      ]),
      els.section('Popup/Tooltip', [
        els.fixWidth('18%', [
          h.h(PopupTrigger, {
            content: 'Qui blandit praesent luptatum zzril delenit.',
            side: 'bottom'
          }, [
            buttonPrimary({}, ['Popup trigger'])
          ])
        ]),
        els.fixWidth('18%', [
          h.h(PopupTrigger, {
            content: h.div({}, [
              h.span({}, ['Qui blandit praesent luptatum ']),
              link({}, ['zzril delenit.'])
            ]),
            side: 'bottom'
          }, [
            buttonPrimary({}, ['Popup trigger'])
          ])
        ]),
        els.fixWidth('18%', [
          buttonPrimary({
            tooltip: 'Aliquam erat volutpat ut wisi enim ad minim, veniam quis nostrud exerci tation.'
          }, ['Tooltip below'])
        ]),
        els.fixWidth('18%', [
          buttonPrimary({
            tooltip: 'Aliquam erat volutpat ut wisi enim ad minim, veniam quis nostrud exerci tation.',
            tooltipSide: 'top'
          }, ['Tooltip above'])
        ]),
        els.fixWidth('18%', [
          buttonPrimary({
            onClick: () => this.setState({ modalOpen: true })
          }, ['Open Modal']),
          this.state.modalOpen && h.h(Modal, {
            title: 'Modal Title',
            onDismiss: () => this.setState({ modalOpen: false })
          }, ['Modal Contents'])
        ])
      ]),
      els.section('Tables', [
        h.div({ style: { height: 300 } }, [
          h.h(AutoSizer, [
            ({ width, height }) => {
              return h.h(FlexTable, {
                width, height,
                rowCount: 100,
                hoverHighlight: true,
                columns: [
                  {
                    size: { basis: 100, grow: 0 },
                    headerRenderer: () => h.h(HeaderCell, ['ID']),
                    cellRenderer: ({ rowIndex }) => `id-${rowIndex}`
                  },
                  {
                    size: { basis: 150, grow: 0 },
                    headerRenderer: () => h.h(HeaderCell, ['Name']),
                    cellRenderer: ({ rowIndex }) => {
                      return h.h(TextCell, `name-${rowIndex} with long text`)
                    }
                  },
                  {
                    size: { basis: 150 },
                    headerRenderer: () => h.h(HeaderCell, ['Details']),
                    cellRenderer: ({ rowIndex }) => {
                      return textInput({ readOnly: true, value: `details-${rowIndex}` })
                    }
                  }
                ]
              })
            }
          ])
        ]),
        h.div({ style: { height: 300, marginTop: '1.5rem' } }, [
          h.h(AutoSizer, [
            ({ width, height }) => {
              return h.h(GridTable, {
                width, height,
                rowCount: 100,
                columns: [
                  ..._.map(n => ({
                    width: 150,
                    headerRenderer: () => h.h(HeaderCell, [`header-${n}`]),
                    cellRenderer: ({ rowIndex }) => `data-${rowIndex}-${n}`
                  }), _.range(0, 20))
                ]
              })
            }
          ])
        ])
      ])
    ])
  }
}

export const addNavPaths = () => {
  Nav.defPath('styles', {
    path: '/',
    component: StyleGuide,
    public: true,
    title: 'Style Guide'
  })
}
