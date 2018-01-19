PP64.ns("strings");

PP64.strings = Object.assign((function() {
  const StringsViewer = class StringsViewer extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        hasError: false
      };
    }

    render() {
      if (this.state.hasError) {
        return (
          <p>An error was encountered.</p>
        );
      }

      let strings = [];

      let strCount = PP64.fs.strings.getStringCount();
      for (let s = 0; s < strCount; s++) {
        let str = PP64.fs.strings.read(s);
        strings.push(str);
      }

      const COL_COUNT = 3;
      const COL_WIDTH = 325;
      const COL_SPACING = 10;

      const {
        CellMeasurer,
        CellMeasurerCache,
        createMasonryCellPositioner,
        Masonry,
        AutoSizer
      } = ReactVirtualized;

      const cache = new CellMeasurerCache({
        defaultHeight: 100,
        defaultWidth: 310,
        fixedWidth: true
      });

      const cellPositioner = createMasonryCellPositioner({
        cellMeasurerCache: cache,
        columnCount: COL_COUNT,
        columnWidth: COL_WIDTH,
        spacer: COL_SPACING
      });

      function cellRenderer ({ index, key, parent, style }) {
        const str = strings[index];

        return (
          <CellMeasurer
            cache={cache}
            index={index}
            key={key}
            parent={parent}>
            <div style={style}>
              <PP64.texteditor.MPEditor
                value={str}
                onValueChange={(id, val) => {
                    // let strBuffer = PP64.utils.arrays.arrayToArrayBuffer(PP64.fs.strings._strToBytes(val));
                    // PP64.fs.strings.write(index, strBuffer);

                    // cache.clearAll();
                    // cellPositioner.reset({
                    //   columnCount: COL_COUNT,
                    //   columnWidth: COL_WIDTH,
                    //   spacer: COL_SPACING
                    // });
                    // parent.recomputeCellPositions();
                }} />
            </div>
          </CellMeasurer>
        );
      }

      return (
        <div className="stringViewerContainer">
          <AutoSizer>
            {({ height, width }) => {
              // Center the columns
              const marginLeft = Math.max(0,
                Math.floor((width - (COL_COUNT * COL_WIDTH) - ((COL_COUNT - 1) * COL_SPACING)) / 2)
              );
              const style = {
                marginLeft: marginLeft
              };
              width -= marginLeft;
              return (
                <Masonry
                  cellCount={strings.length}
                  cellMeasurerCache={cache}
                  cellPositioner={cellPositioner}
                  cellRenderer={cellRenderer}
                  height={height}
                  width={width}
                  style={style}
                />
              );
            }}
          </AutoSizer>
        </div>
      );
    }

    componentDidCatch(error, info) {
      this.setState({ hasError: true });
      console.error(error);
    }
  }

  const StringEditorToolbar = class StringEditorToolbar extends React.Component {
    state = {}

    render() {
      return (
        <div className="stringEditorToolbar">

        </div>
      );
    }
  }

  return {
    StringsViewer,
  };
})());