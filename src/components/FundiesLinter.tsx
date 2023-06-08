import React, { PureComponent } from "react";
import { lint } from "@dylanburati/teachlangs-lint";

type StandardInProps = {
  doSubmit: (value: string) => void;
};

class StandardIn extends PureComponent<StandardInProps, { value: string }> {
  constructor(props: StandardInProps) {
    super(props);
    this.state = { value: "" };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit() {
    this.props.doSubmit(this.state.value);
  }

  render() {
    return (
      <>
        <div>
          <textarea
            onChange={(evt) => this.setState({ value: evt.target.value })}
            className="w-full font-mono text-sm leading-tight border-2 border-paper-dark focus:border-accent-200 p-2
              placeholder-pen-light bg-paper"
            placeholder="Paste code from DrRacket"
            spellCheck={false}
            style={{ height: "25rem" }}
          />
        </div>
        <button
          className="bg-accent-200 hover:bg-accent text-white py-2 px-4 rounded"
          type="submit"
          onClick={this.handleSubmit}
        >
          Check
        </button>
      </>
    );
  }
}

export type FundiesLinterProps = {
  className: string;
}

type FundiesLinterState = {
  warningGroups: {
    title: string;
    warnings: string[];
  }[] | null;
  error: string | null;
}

export class FundiesLinter extends React.Component<FundiesLinterProps, FundiesLinterState> {
  constructor(props: FundiesLinterProps) {
    super(props);
    this.state = {
      warningGroups: null,
      error: null,
    };
    this.doLint = this.doLint.bind(this);
  }

  doLint(src: string): void {
    lint(src).then(
      (wArr) => {
        this.setState({
          warningGroups: wArr,
          error: null,
        });
      },
      (msg) => {
        this.setState({
          warningGroups: null,
          error: msg,
        });
      }
    );
  }

  render() {
    let standardOut: React.ReactNode = null;
    if (this.state.error !== null) {
      standardOut = (
        <div className="mt-4">
          <em className="font-bold text-danger">{this.state.error}</em>
        </div>
      );
    } else if (Array.isArray(this.state.warningGroups)) {
      const groupCount = this.state.warningGroups.length;
      standardOut = (
        <div className="mt-4">
          <h3>{groupCount === 0 ? "0 warnings" : "Warnings"}</h3>

          {this.state.warningGroups.map(({ title, warnings }, i) => (
            <details className="mb-4" open={true} key={i}>
              <summary className="p-1 bg-paper-darker cursor-pointer">
                {title}
              </summary>
              {warnings.map((w, j) => (
                <p className="ml-6 mb-0 text-sm font-mono" key={j}>
                  {w}
                </p>
              ))}
            </details>
          ))}
        </div>
      );
    }
    return (
      <div className={this.props.className}>
        <StandardIn doSubmit={this.doLint}></StandardIn>
        {standardOut}
      </div>
    );
  }
}
