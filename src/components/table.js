import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { createRef, Fragment } from 'react'
import DraggableCore from 'react-draggable'
import * as h from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import Pagination from 'react-paginating'
import { arrayMove, SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc'
import { AutoSizer, Grid as RVGrid, List, ScrollSync as RVScrollSync } from 'react-virtualized'
import { buttonPrimary, Checkbox, Clickable, linkButton } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const paginatorButton = (props, label) => h.button(_.merge({
  style: {
    margin: '0 2px', padding: '0.25rem 0.5rem',
    border: '1px solid #ccc', borderRadius: 3,
    color: props.disabled ? colors.gray[2] : colors.blue[1], backgroundColor: 'white',
    cursor: props.disabled ? 'not-allowed' : 'pointer'
  }
}, props), label)

/**
 * @param {number} props.filteredDataLength
 * @param {number} props.pageNumber
 * @param {function(number)} props.setPageNumber
 * @param {function(number)} [props.setItemsPerPage]
 * @param {number} props.itemsPerPage
 * @param {number[]} [props.itemsPerPageOptions=[10,25,50,100]]
 */
export const paginator = function(props) {
  const {
    filteredDataLength, pageNumber, setPageNumber, setItemsPerPage,
    itemsPerPage, itemsPerPageOptions = [10, 25, 50, 100]
  } = props

  return h.h(Pagination, {
    total: filteredDataLength,
    limit: itemsPerPage,
    pageCount: 5,
    currentPage: pageNumber
  }, [
    ({ pages, currentPage, hasNextPage, hasPreviousPage, previousPage, nextPage, totalPages, getPageItemProps }) => h.h(Fragment,
      [
        h.div({ style: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '1rem' } }, [
          `${(pageNumber - 1) * itemsPerPage + 1} - ${_.min([filteredDataLength, pageNumber * itemsPerPage])} of ${filteredDataLength}`,
          h.div({ style: { display: 'inline-flex', padding: '0 1rem' } }, [

            paginatorButton(
              _.merge({ disabled: currentPage === 1, style: { marginRight: '0.5rem' } },
                getPageItemProps({ pageValue: 1, onPageChange: setPageNumber })),
              [icon('angle-double left', { size: 12 })]
            ),

            paginatorButton(
              _.merge({ disabled: !hasPreviousPage, style: { marginRight: '1rem' } },
                getPageItemProps({ pageValue: previousPage, onPageChange: setPageNumber })),
              [icon('angle left', { size: 12 })]
            ),

            _.map(num => paginatorButton(
              _.merge({
                key: num,
                style: {
                  minWidth: '2rem',
                  backgroundColor: currentPage === num ? colors.blue[1] : undefined,
                  color: currentPage === num ? 'white' : colors.blue[1],
                  border: currentPage === num ? colors.blue[1] : undefined
                }
              },
              getPageItemProps({ pageValue: num, onPageChange: setPageNumber })),
              num), pages
            ),

            paginatorButton(
              _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
                getPageItemProps({ pageValue: nextPage, onPageChange: setPageNumber })),
              [icon('angle right', { size: 12 })]
            ),

            paginatorButton(
              _.merge({ disabled: currentPage === totalPages, style: { marginLeft: '0.5rem' } },
                getPageItemProps({ pageValue: totalPages, onPageChange: setPageNumber })),
              [icon('angle-double right', { size: 12 })]
            )
          ]),

          setItemsPerPage && h.h(Fragment, [
            'Items per page:',
            h.select({
              style: { marginLeft: '0.5rem' },
              onChange: e => setItemsPerPage(parseInt(e.target.value, 10)),
              value: itemsPerPage
            },
            _.map(i => h.option({ value: i }, i),
              itemsPerPageOptions))
          ])
        ])
      ]
    )
  ])
}

const cellStyles = {
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '1rem',
  paddingRight: '1rem'
}

const styles = {
  cell: (col, total) => ({
    ...cellStyles,
    borderBottom: `1px solid ${colors.gray[3]}`,
    borderLeft: col === 0 ? `1px solid ${colors.gray[3]}` : undefined,
    borderRight: col === total - 1 ? `1px solid ${colors.gray[3]}` : undefined
  }),
  header: (col, total) => ({
    ...cellStyles,
    backgroundColor: colors.blue[4],
    borderTop: `1px solid ${colors.blue[1]}`,
    borderBottom: `2px solid ${colors.blue[1]}`,
    borderLeft: col === 0 ? `1px solid ${colors.blue[1]}` : undefined,
    borderRight: col === total - 1 ? `1px solid ${colors.blue[1]}` : undefined,
    borderTopLeftRadius: col === 0 ? '5px' : undefined,
    borderTopRightRadius: col === total - 1 ? '5px' : undefined
  }),
  flexCell: ({ basis = 0, grow = 1, shrink = 1, min = 0, max } = {}) => ({
    flexGrow: grow,
    flexShrink: shrink,
    flexBasis: basis,
    minWidth: min,
    maxWidth: max
  }),
  columnSelector: {
    position: 'absolute', top: 0, right: 0, width: 48, height: 48,
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    color: colors.blue[0], backgroundColor: colors.blue[3],
    border: `1px solid ${colors.blue[1]}`,
    borderRadius: 5
  },
  columnName: {
    paddingLeft: '0.25rem',
    flex: 1, display: 'flex', alignItems: 'center',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  columnHandle: {
    paddingRight: '0.25rem', cursor: 'move',
    display: 'flex', alignItems: 'center'
  }
}

/**
 * A virtual table with a fixed header and flexible column widths. Intended to take up the full
 * available container width, without horizontal scrolling.
 */
export class FlexTable extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    initialY: PropTypes.number,
    rowCount: PropTypes.number.isRequired,
    styleRow: PropTypes.func,
    columns: PropTypes.arrayOf(PropTypes.shape({
      headerRenderer: PropTypes.func.isRequired,
      cellRenderer: PropTypes.func.isRequired,
      size: PropTypes.shape({
        basis: PropTypes.number, // flex-basis in px, default 0
        grow: PropTypes.number, // flex-grow, default 1
        max: PropTypes.number, // max-width in px
        min: PropTypes.number, // min-width in px, default 0
        shrink: PropTypes.number // flex-shrink, default 1
      })
    })),
    hoverHighlight: PropTypes.bool,
    onScroll: PropTypes.func
  }

  static defaultProps = {
    initialY: 0,
    styleRow: () => ({}),
    columns: [],
    hoverHighlight: false,
    onScroll: _.noop
  }

  constructor(props) {
    super(props)
    this.state = { scrollbarSize: 0 }
    this.body = createRef()
  }

  componentDidMount() {
    const { initialY: scrollTop } = this.props
    this.body.current.scrollToPosition({ scrollTop })
  }

  render() {
    const { width, height, rowCount, styleRow, columns, hoverHighlight, onScroll } = this.props
    const { scrollbarSize } = this.state

    return h.div([
      h.div({
        style: {
          width: width - scrollbarSize,
          height: 48,
          display: 'flex'
        }
      }, [
        ..._.map(([i, { size, headerRenderer }]) => {
          return h.div({
            key: i,
            style: { ...styles.flexCell(size), ...styles.header(i * 1, columns.length) }
          }, [headerRenderer()])
        }, _.toPairs(columns))
      ]),
      h.h(RVGrid, {
        ref: this.body,
        width,
        height: height - 48,
        columnWidth: width - scrollbarSize,
        rowHeight: 48,
        rowCount,
        columnCount: 1,
        onScrollbarPresenceChange: ({ vertical, size }) => {
          this.setState({ scrollbarSize: vertical ? size : 0 })
        },
        cellRenderer: data => {
          return h.h(Interactive, {
            key: data.key,
            as: 'div',
            className: 'table-row',
            style: { ...data.style, backgroundColor: 'white', display: 'flex', ...styleRow(data.rowIndex) },
            hover: hoverHighlight ? { backgroundColor: colors.blue[5] } : undefined
          }, [
            ..._.map(([i, { size, cellRenderer }]) => {
              return h.div({
                key: i,
                style: { ...styles.flexCell(size), ...styles.cell(i * 1, columns.length) }
              }, [cellRenderer(data)])
            }, _.toPairs(columns))
          ])
        },
        style: { outline: 'none' },
        onScroll: ({ scrollTop }) => onScroll(scrollTop)
      })
    ])
  }
}

/**
 * A virtual table with a fixed header and explicit column widths. Intended for displaying large
 * datasets which may require horizontal scrolling.
 */
export class GridTable extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    initialX: PropTypes.number,
    initialY: PropTypes.number,
    rowCount: PropTypes.number.isRequired,
    styleCell: PropTypes.func,
    columns: PropTypes.arrayOf(PropTypes.shape({ width: PropTypes.number.isRequired })),
    onScroll: PropTypes.func
  }

  static defaultProps = {
    initialX: 0,
    initialY: 0,
    styleCell: () => ({}),
    columns: [],
    onScroll: _.noop
  }

  constructor(props) {
    super(props)
    this.state = { scrollbarSize: 0 }
    this.header = createRef()
    this.body = createRef()
    this.scrollSync = createRef()
  }

  componentDidMount() {
    this.body.current.measureAllCells()

    const { initialX: scrollLeft, initialY: scrollTop } = this.props

    this.scrollSync.current._onScroll({ scrollLeft }) //BEWARE: utilizing private method from scrollSync that is not intended to be used

    this.body.current.scrollToPosition({ scrollLeft, scrollTop }) // waiting to let ScrollSync initialize
  }

  recomputeColumnSizes() {
    this.header.current.recomputeGridSize()
    this.body.current.recomputeGridSize()
    this.body.current.measureAllCells()
  }

  scrollToTop() {
    this.body.current.scrollToPosition({ scrollTop: 0, scrollLeft: 0 })
  }

  render() {
    const { width, height, rowCount, columns, styleCell, onScroll: customOnScroll } = this.props
    const { scrollbarSize } = this.state
    return h.h(RVScrollSync, {
      ref: this.scrollSync
    }, [
      ({ onScroll, scrollLeft }) => {
        return h.div([
          h.h(RVGrid, {
            ref: this.header,
            width: width - scrollbarSize,
            height: 48,
            columnWidth: ({ index }) => columns[index].width,
            rowHeight: 48,
            rowCount: 1,
            columnCount: columns.length,
            cellRenderer: data => {
              return h.div({
                key: data.key,
                style: { ...data.style, ...styles.header(data.columnIndex, columns.length) }
              }, [
                columns[data.columnIndex].headerRenderer(data)
              ])
            },
            style: { outline: 'none', overflowX: 'hidden', overflowY: 'hidden' },
            scrollLeft,
            onScroll
          }),
          h.h(RVGrid, {
            ref: this.body,
            width,
            height: height - 48,
            columnWidth: ({ index }) => columns[index].width,
            rowHeight: 48,
            rowCount,
            columnCount: columns.length,
            onScrollbarPresenceChange: ({ vertical, size }) => {
              this.setState({ scrollbarSize: vertical ? size : 0 })
            },
            cellRenderer: data => {
              return h.div({
                key: data.key,
                style: {
                  ...data.style,
                  ...styles.cell(data.columnIndex, columns.length),
                  backgroundColor: 'white',
                  ...styleCell(data)
                }
              }, [
                columns[data.columnIndex].cellRenderer(data)
              ])
            },
            style: { outline: 'none' },
            scrollLeft,
            onScroll: details => {
              onScroll(details)
              const { scrollLeft, scrollTop } = details
              customOnScroll(scrollLeft, scrollTop)
            }
          })
        ])
      }
    ])
  }
}

export const SimpleTable = ({ columns, rows }) => {
  const rowHeight = 24
  const cellStyles = { display: 'flex', alignItems: 'center' }
  return h.h(Fragment, [
    h.div({ style: { display: 'flex', height: rowHeight } }, [
      _.map(({ key, header, size }) => {
        return h.div({ key, style: { ...cellStyles, ...styles.flexCell(size) } }, [header])
      }, columns)
    ]),
    _.map(([i, row]) => {
      return h.h(Interactive, {
        key: i,
        as: 'div',
        style: { display: 'flex', height: rowHeight }, className: 'table-row',
        hover: { backgroundColor: colors.blue[5] }
      }, [
        _.map(({ key, size }) => {
          return h.div({
            key,
            style: {
              ...cellStyles, ...styles.flexCell(size),
              borderTop: `1px solid ${colors.gray[5]}`
            }
          }, [row[key]])
        }, columns)
      ])
    }, _.toPairs(rows))
  ])
}

export const TextCell = props => {
  return h.div(_.merge({
    style: { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }
  }, props))
}

export const HeaderCell = props => {
  return h.h(TextCell, _.merge({ style: { fontWeight: 'bold' } }, props))
}

export const Sortable = ({ sort, field, onSort, children }) => {
  return h.div({
    style: { flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' },
    onClick: () => onSort(Utils.nextSort(sort, field))
  }, [
    children,
    sort.field === field && h.div({
      style: { color: colors.blue[0], marginLeft: 'auto' }
    }, [
      icon(sort.direction === 'asc' ? 'arrow down' : 'arrow')
    ])
  ])
}

export class Resizable extends Component {
  render() {
    const { onWidthChange, width, minWidth = 100, children } = this.props
    const { dragAmount, lastX } = this.state

    return h.div({
      style: { flex: 1, display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }
    }, [
      children,
      h.h(DraggableCore, {
        axis: 'x',
        onStart: e => this.setState({ dragAmount: 0, lastX: e.clientX }),
        onDrag: e => {
          const deltaX = e.clientX - lastX
          if (deltaX !== 0 && width + dragAmount + deltaX > minWidth) {
            this.setState({ dragAmount: dragAmount + deltaX, lastX: e.clientX })
          }
        },
        onStop: () => {
          this.setState({ dragAmount: undefined })
          onWidthChange(dragAmount)
        },
        position: { x: 0 }
      }, [
        icon('columnGrabber', {
          size: 24,
          style: { position: 'absolute', right: -20, cursor: 'ew-resize' }
        })
      ]),
      !!dragAmount && icon('columnGrabber', {
        size: 24,
        style: { position: 'absolute', right: -20 - dragAmount, zIndex: 1, opacity: '0.5', cursor: 'ew-resize' }
      })
    ])
  }
}

const SortableDiv = SortableElement(props => h.div(props))
const SortableList = SortableContainer(props => h.h(List, props))
const SortableHandleDiv = SortableHandle(props => h.div(props))

/**
 * @param {Object[]} columnSettings - current column list, in order
 * @param {string} columnSettings[].name
 * @param {bool} columnSettings[].visible
 * @param {function(Object[])} onSave - called with modified settings when user saves
 */
export class ColumnSelector extends Component {
  constructor(props) {
    super(props)
    this.state = { open: false, modifiedColumnSettings: undefined }
  }

  toggleVisibility(index) {
    this.setState(_.update(['modifiedColumnSettings', index, 'visible'], b => !b))
  }

  setAll(value) {
    this.setState(_.update(['modifiedColumnSettings'], _.map(_.set('visible', value))))
  }

  sort() {
    this.setState(_.update(['modifiedColumnSettings'], _.sortBy('name')))
  }

  reorder({ oldIndex, newIndex }) {
    const { modifiedColumnSettings } = this.state
    this.setState({ modifiedColumnSettings: arrayMove(modifiedColumnSettings, oldIndex, newIndex) })
  }

  render() {
    const { onSave, columnSettings } = this.props
    const { open, modifiedColumnSettings } = this.state
    return h.h(Fragment, [
      h.h(Clickable, {
        style: styles.columnSelector,
        onClick: () => this.setState({ open: true, modifiedColumnSettings: columnSettings })
      }, [icon('cog', { size: 20, className: 'is-solid' })]),
      open && h.h(Modal, {
        title: 'Select columns',
        onDismiss: () => this.setState({ open: false }),
        okButton: buttonPrimary({
          onClick: () => {
            onSave(modifiedColumnSettings)
            this.setState({ open: false })
          }
        }, ['Done'])
      }, [
        h.div({ style: { marginBottom: '1rem', display: 'flex' } }, [
          h.div({ style: { fontWeight: 500 } }, ['Show:']),
          linkButton({ style: { padding: '0 0.5rem' }, onClick: () => this.setAll(true) }, ['all']),
          '|',
          linkButton({ style: { padding: '0 0.5rem' }, onClick: () => this.setAll(false) }, ['none']),
          h.div({ style: { marginLeft: 'auto', fontWeight: 500 } }, ['Sort:']),
          linkButton({ style: { padding: '0 0.5rem' }, onClick: () => this.sort() }, ['reset'])
        ]),
        h.h(AutoSizer, { disableHeight: true }, [
          ({ width }) => {
            return h.h(SortableList, {
              style: { outline: 'none' },
              lockAxis: 'y',
              useDragHandle: true,
              width, height: 400,
              rowCount: modifiedColumnSettings.length,
              rowHeight: 30,
              rowRenderer: ({ index, style, key }) => {
                const { name, visible } = modifiedColumnSettings[index]
                return h.h(SortableDiv, { key, index, style: { ...style, display: 'flex' } }, [
                  h.h(SortableHandleDiv, { style: styles.columnHandle }, [
                    icon('bars')
                  ]),
                  h.div({ style: { display: 'flex', alignItems: 'center' } }, [
                    h.h(Checkbox, {
                      checked: visible,
                      onChange: () => this.toggleVisibility(index)
                    })
                  ]),
                  h.h(Clickable, {
                    style: styles.columnName,
                    onClick: () => this.toggleVisibility(index)
                  }, [name])
                ])
              },
              onSortEnd: v => this.reorder(v)
            })
          }
        ])
      ])
    ])
  }
}
