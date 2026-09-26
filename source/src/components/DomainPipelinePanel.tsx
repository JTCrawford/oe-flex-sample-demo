import { domainPipelines } from '../data/domains';
import { landWegSample, landWegMeta } from '../data/landWegSample';
import { SalesCallout } from './SalesCallout';

export function DomainPipelinePanel() {
  return (
    <div className="panel domain-panel">
      <h2>Domain pipelines</h2>
      <SalesCallout id="domains" compact />
      <SalesCallout id="land" compact />
      <div className="domain-grid">
        {domainPipelines.map((d) => (
          <div
            key={d.id}
            className={`domain-card ${d.status === 'LIVE' ? 'live' : 'stub'}`}
          >
            <header>
              <strong>{d.label}</strong>
              <span className={`status ${d.status}`}>{d.status}</span>
            </header>
            <p>{d.note}</p>
          </div>
        ))}
      </div>

      <section>
        <h3>
          Land WEG SAMPLE{' '}
          <em className="sample-tag">
            {landWegMeta.label} / {landWegMeta.claim}
          </em>
        </h3>
        <table className="weg-table">
          <thead>
            <tr>
              <th>Designation</th>
              <th>Type</th>
              <th>Armament</th>
              <th>Crew</th>
            </tr>
          </thead>
          <tbody>
            {landWegSample.map((e) => (
              <tr key={e.id}>
                <td>{e.designation}</td>
                <td>{e.type}</td>
                <td>{e.mainArmament}</td>
                <td>{e.crew}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
