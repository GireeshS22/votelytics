/**
 * Terms and Conditions page
 */

function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: November 1, 2025</p>

          {/* Summary Box - Moved to Top */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Summary (Not Legal Advice)</h3>
            <p className="text-sm text-gray-700">
              Votelytics is a free educational project. We display election data but cannot
              guarantee its accuracy. Use at your own risk. Always verify important information
              with official sources like the Election Commission of India. We are not liable for
              any damages arising from your use of this website.
            </p>
          </div>

          <div>
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to Votelytics. This is a free, open-source educational project created for
                informational and analytical purposes only. By accessing or using this website, you
                agree to be bound by these Terms and Conditions.
              </p>
              <p className="text-gray-700">
                <strong>Important:</strong> Votelytics is an independent, non-commercial weekend
                project and is NOT affiliated with, endorsed by, or connected to the Election
                Commission of India, any government body, political party, or official electoral
                organization.
              </p>
            </section>

            {/* Data Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Disclaimer</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-gray-800 font-semibold">
                  DISCLAIMER: NO WARRANTY OF DATA ACCURACY
                </p>
              </div>
              <ul className="list-disc pl-4 text-gray-700 space-y-2">
                <li>
                  All election data displayed on Votelytics is sourced from publicly available
                  datasets and third-party sources. While we strive for accuracy, we cannot
                  guarantee that the data is complete, accurate, current, or error-free.
                </li>
                <li>
                  Election results, candidate information, vote counts, and all other data may
                  contain errors, omissions, or inaccuracies. Data may be outdated or incomplete.
                </li>
                <li>
                  This website should NOT be used as the sole or primary source for official
                  election information, academic research requiring verified data, or any
                  decision-making purposes.
                </li>
                <li>
                  For official and verified election data, please visit the Election Commission of
                  India's official website at{' '}
                  <a
                    href="https://eci.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    eci.gov.in
                  </a>
                  .
                </li>
                <li>
                  We are not responsible for any decisions, actions, or consequences arising from
                  reliance on the data provided on this website.
                </li>
              </ul>
            </section>

            {/* Intended Use */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Intended Use</h2>
              <p className="text-gray-700 mb-4">
                Votelytics is intended for:
              </p>
              <ul className="list-disc pl-4 text-gray-700 space-y-2 mb-4">
                <li>Educational and informational purposes only</li>
                <li>General interest exploration of electoral trends and patterns</li>
                <li>Casual analysis and visualization of publicly available election data</li>
                <li>Learning about web development and data visualization techniques</li>
              </ul>
              <p className="text-gray-700">
                This website is NOT intended for:
              </p>
              <ul className="list-disc pl-4 text-gray-700 space-y-2">
                <li>Official election reporting or verification</li>
                <li>Academic or professional research requiring verified data</li>
                <li>Political campaigning, propaganda, or electoral influence</li>
                <li>Legal proceedings or official documentation</li>
                <li>Commercial purposes or decision-making</li>
              </ul>
            </section>

            {/* No Warranty */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. No Warranty</h2>
              <p className="text-gray-700 mb-4">
                THIS WEBSITE AND ALL CONTENT, DATA, AND SERVICES ARE PROVIDED "AS IS" AND "AS
                AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
              </p>
              <p className="text-gray-700 mb-4">
                We explicitly disclaim all warranties, including but not limited to:
              </p>
              <ul className="list-disc pl-4 text-gray-700 space-y-2">
                <li>Warranties of accuracy, completeness, or reliability of data</li>
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Warranties of uninterrupted or error-free operation</li>
                <li>Warranties that the website will be free from viruses or harmful components</li>
                <li>Warranties of non-infringement</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE CREATORS,
                CONTRIBUTORS, OR MAINTAINERS OF VOTELYTICS BE LIABLE FOR ANY:
              </p>
              <ul className="list-disc pl-4 text-gray-700 space-y-2">
                <li>
                  Direct, indirect, incidental, special, consequential, or punitive damages
                </li>
                <li>Loss of profits, revenue, data, or use</li>
                <li>
                  Damages arising from reliance on inaccurate, incomplete, or outdated data
                </li>
                <li>
                  Damages arising from decisions made based on information from this website
                </li>
                <li>
                  Damages resulting from unauthorized access, data breaches, or technical failures
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                This limitation applies regardless of the legal theory (contract, tort, negligence,
                or otherwise) and even if we have been advised of the possibility of such damages.
              </p>
            </section>

            {/* Open Source */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Open Source Project</h2>
              <p className="text-gray-700 mb-4">
                Votelytics is a free, open-source project. The source code is available for review,
                modification, and distribution under the terms of the applicable open-source license.
              </p>
              <ul className="list-disc pl-4 text-gray-700 space-y-2">
                <li>This is a personal/community project with no commercial backing</li>
                <li>Development is done on a best-effort basis with no guarantees</li>
                <li>The project may be discontinued, modified, or updated at any time</li>
                <li>Community contributions are welcome but come with no warranty</li>
              </ul>
            </section>

            {/* Third-Party Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Data Sources</h2>
              <p className="text-gray-700 mb-4">
                Data displayed on Votelytics may be sourced from:
              </p>
              <ul className="list-disc pl-4 text-gray-700 space-y-2 mb-4">
                <li>Publicly available government datasets</li>
                <li>Third-party data aggregators and repositories</li>
                <li>Public domain sources and open data initiatives</li>
                <li>User contributions and community submissions</li>
              </ul>
              <p className="text-gray-700">
                We do not control or verify third-party data sources and are not responsible for
                their accuracy, availability, or reliability. Data processing errors may occur during
                import, transformation, or display.
              </p>
            </section>

            {/* User Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. User Responsibilities</h2>
              <p className="text-gray-700 mb-4">By using this website, you agree to:</p>
              <ul className="list-disc pl-4 text-gray-700 space-y-2">
                <li>
                  Use the website for lawful purposes only and in compliance with all applicable laws
                </li>
                <li>
                  Verify any critical information with official sources before relying on it
                </li>
                <li>Not use the data for political manipulation, misinformation, or propaganda</li>
                <li>
                  Not hold the creators liable for any consequences of using the website or its data
                </li>
                <li>
                  Acknowledge that this is an unofficial, educational resource
                </li>
              </ul>
            </section>

            {/* No Political Affiliation */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Political Neutrality</h2>
              <p className="text-gray-700 mb-4">
                Votelytics is politically neutral and does not endorse, support, or oppose any:
              </p>
              <ul className="list-disc pl-4 text-gray-700 space-y-2">
                <li>Political party or alliance</li>
                <li>Candidate or elected representative</li>
                <li>Political ideology or movement</li>
                <li>Electoral outcome or result</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Any appearance of bias is unintentional and likely due to data representation or
                visualization choices made for technical or design reasons.
              </p>
            </section>

            {/* Indemnification */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify, defend, and hold harmless the creators, contributors, and
                maintainers of Votelytics from any claims, damages, liabilities, costs, or expenses
                (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-4 text-gray-700 space-y-2 mt-4">
                <li>Your use or misuse of the website</li>
                <li>Your reliance on data or information from the website</li>
                <li>Your violation of these Terms and Conditions</li>
                <li>Your violation of any third-party rights</li>
              </ul>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms and Conditions at any time without prior
                notice. Your continued use of the website after changes constitutes acceptance of the
                modified terms. Please check this page periodically for updates.
              </p>
            </section>

            {/* Severability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Severability</h2>
              <p className="text-gray-700">
                If any provision of these Terms is found to be invalid, illegal, or unenforceable,
                the remaining provisions shall continue in full force and effect.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700">
                These Terms and Conditions shall be governed by and construed in accordance with the
                laws of India, without regard to its conflict of law provisions.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions, concerns, or to report data inaccuracies, please contact us through
                the project's GitHub repository or via email.
              </p>
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Project Type:</strong> Open Source Educational Project
                  <br />
                  <strong>Status:</strong> Beta / Development
                  <br />
                  <strong>Support:</strong> Community-driven, best effort only
                </p>
              </div>
            </section>

            {/* Acceptance */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Acceptance of Terms</h2>
              <p className="text-gray-700 font-semibold">
                BY USING THIS WEBSITE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO
                BE BOUND BY THESE TERMS AND CONDITIONS. IF YOU DO NOT AGREE, PLEASE DO NOT USE THIS
                WEBSITE.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;
