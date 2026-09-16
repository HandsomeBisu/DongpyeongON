import type { Metadata } from "next";
import { PolicyLayout } from "@/components/legal/policy-layout";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | 동평ON",
  description: "동평ON 개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <PolicyLayout
      eyebrow="PRIVACY POLICY"
      title="개인정보 처리방침"
      description="DPS Team은 동평ON 이용자의 개인정보를 중요하게 생각하며, 처리 목적과 범위를 투명하게 안내합니다."
      effectiveDate="2026년 9월 16일"
    >
      <PolicySection title="1. 개인정보 처리방침의 목적">
        <p>
          DPS Team(이하 “제공자”)은 개인정보 보호법 등 관련 법령에 따라 동평ON
          이용자의 개인정보를 보호하고, 개인정보 처리와 관련한 문의 및 권리
          행사를 신속하게 처리하기 위해 본 개인정보 처리방침을 수립·공개합니다.
        </p>
      </PolicySection>

      <PolicySection title="2. 처리하는 개인정보의 항목·목적·보유기간">
        <div className="policy-table-wrap">
          <table>
            <thead>
              <tr>
                <th>구분</th>
                <th>처리 항목</th>
                <th>처리 목적</th>
                <th>보유기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>회원 및 인증</td>
                <td>
                  Firebase UID, 학교 이메일, 비밀번호 인증 정보 또는 Google
                  로그인 식별정보, 이메일 인증 여부
                </td>
                <td>본인 확인, 회원가입, 로그인, 부정 이용 방지</td>
                <td>회원 탈퇴 또는 삭제 요청 처리 완료 시까지</td>
              </tr>
              <tr>
                <td>학생 프로필</td>
                <td>
                  이름, 학년, 반, 번호, 표시 이름, 프로필 사진, 사용자 권한
                </td>
                <td>학교 구성원 확인, 맞춤 기능 및 권한 제공</td>
                <td>회원 탈퇴 또는 삭제 요청 처리 완료 시까지</td>
              </tr>
              <tr>
                <td>커뮤니티</td>
                <td>게시물, 댓글, 좋아요, 작성자 식별정보, 작성·수정 시각</td>
                <td>커뮤니티 기능 제공, 게시물 관리</td>
                <td>이용자가 삭제하거나 계정 삭제 요청이 처리될 때까지</td>
              </tr>
              <tr>
                <td>신고·신문고</td>
                <td>
                  신고 대상과 사유, 상세 내용, 건의 제목·내용·분류, 작성자
                  식별정보, 처리 상태
                </td>
                <td>권리 침해 대응, 서비스 안전 관리, 학교 건의 처리</td>
                <td>서비스 운영기간 또는 관련 요청의 삭제 처리 완료 시까지</td>
              </tr>
              <tr>
                <td>알림</td>
                <td>알림 유형·내용·연결 주소, 수신자 식별정보, 생성 시각</td>
                <td>공지, 커뮤니티 반응 및 신고 처리 결과 안내</td>
                <td>이용자가 모두 지우기를 실행하거나 계정을 삭제할 때까지</td>
              </tr>
              <tr>
                <td>신청곡</td>
                <td>
                  Spotify 곡 식별정보와 메타데이터, 신청자 식별정보·이름·학급
                  정보, 신청·처리 상태 및 시각
                </td>
                <td>일일 신청 제한, 중복 신청 방지, 방송 승인과 재생 관리</td>
                <td>서비스 운영기간 또는 삭제 요청 처리 완료 시까지</td>
              </tr>
              <tr>
                <td>보안·접속 기록</td>
                <td>
                  접속 IP 또는 그 해시값, 요청 시각, 브라우저·기기 정보, 오류 및
                  보안 로그
                </td>
                <td>인증 요청 제한, 장애 대응, 보안과 부정 이용 방지</td>
                <td>
                  목적 달성 시까지 또는 관련 서비스의 설정된 로그 보관기간
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          이메일 인증 코드는 원문으로 저장하지 않고 복원하기 어려운 해시값으로
          처리하며, 코드는 발급 후 10분 동안만 유효합니다. 법령상 보존 의무가
          있는 경우 해당 기간 동안 별도로 보관한 뒤 파기합니다.
        </p>
      </PolicySection>

      <PolicySection title="3. 개인정보의 처리 근거">
        <p>
          제공자는 이용자가 서비스 가입과 이용 과정에서 표시한 동의, 서비스 이용
          계약의 체결·이행, 정보주체의 요청 처리 및 관련 법령상 의무 이행을
          근거로 필요한 최소 범위의 개인정보를 처리합니다. 필수 항목 제공을
          거부할 수 있으나, 이 경우 회원 인증 또는 일부 기능 이용이 제한될 수
          있습니다.
        </p>
      </PolicySection>

      <PolicySection title="4. 만 14세 미만 아동의 개인정보">
        <ol>
          <li>
            만 14세 미만 이용자가 개인정보 처리에 동의해야 하는 경우
            법정대리인의 동의를 받아야 하며, 제공자는 관련 법령에 따라 동의
            여부를 확인할 수 있습니다.
          </li>
          <li>
            법정대리인은 아동의 개인정보에 대한 열람, 정정·삭제, 처리정지 및
            동의 철회를 요청할 수 있습니다.
          </li>
          <li>
            필요한 법정대리인 동의가 확인되지 않은 경우 가입이나 서비스 이용이
            제한될 수 있습니다.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="5. 개인정보의 제3자 제공">
        <p>
          제공자는 원칙적으로 이용자의 개인정보를 외부에 판매하거나 제공하지
          않습니다. 다만 이용자가 사전에 동의한 경우, 법령에 특별한 규정이 있는
          경우, 급박한 생명·신체의 이익을 보호하기 위해 필요한 경우 등 법령이
          허용하는 범위에서는 개인정보가 제공될 수 있습니다.
        </p>
        <p>
          동평신문고 내용이 실제 학교 담당자에게 전달되는 경우, 전달 전
          이용자에게 제공받는 자, 목적, 항목 및 보유기간을 별도로 알리고 필요한
          동의를 받습니다.
        </p>
      </PolicySection>

      <PolicySection title="6. 개인정보 처리업무의 위탁 및 외부 서비스">
        <div className="policy-table-wrap">
          <table>
            <thead>
              <tr>
                <th>수탁자·서비스</th>
                <th>업무 내용</th>
                <th>처리 정보</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google LLC (Firebase)</td>
                <td>회원 인증, 데이터베이스 및 서비스 인프라</td>
                <td>계정, 프로필, 게시물 및 서비스 이용정보</td>
              </tr>
              <tr>
                <td>Vercel Inc.</td>
                <td>웹사이트 호스팅, 서버 기능 실행, 장애·접속 로그 처리</td>
                <td>
                  요청 정보, IP, 기기·브라우저 정보 및 전송되는 서비스 데이터
                </td>
              </tr>
              <tr>
                <td>Spotify AB</td>
                <td>음악 검색과 재생 기능 연동</td>
                <td>검색어, 곡 식별정보 및 Spotify 연동에 필요한 기술 정보</td>
              </tr>
              <tr>
                <td>나이스 교육정보 개방 포털</td>
                <td>학교 급식과 학급 시간표 조회</td>
                <td>학교 코드, 조회 일자, 학년 및 반</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          제공자는 위탁계약 및 서비스 설정을 통해 개인정보가 안전하게 처리되도록
          관리·감독하며, 수탁자 또는 업무 내용이 변경되면 본 방침을 통해
          공개합니다.
        </p>
      </PolicySection>

      <PolicySection title="7. 개인정보의 국외 처리 가능성">
        <p>
          Firebase, Vercel 및 Spotify는 글로벌 인프라를 운영하므로 서비스 이용
          과정에서 정보가 미국, 유럽연합 또는 서비스 제공 사업자의 데이터센터가
          위치한 국가에서 저장·처리될 수 있습니다. 정보는 서비스 요청 시
          암호화된 네트워크를 통해 전송되며, 회원 인증·호스팅·음악 연동 목적과
          각 항목의 보유기간 범위에서 처리됩니다. 이용자는 아래 문의처를 통해
          국외 처리에 관한 상세 내용과 거부 방법을 문의할 수 있으며, 처리를
          거부하면 관련 기능 이용이 제한될 수 있습니다.
        </p>
      </PolicySection>

      <PolicySection title="8. 개인정보의 파기">
        <ol>
          <li>
            개인정보가 불필요하게 되었거나 이용자가 적법한 삭제를 요청한 경우,
            제공자는 관련 법령과 운영상 필요한 확인 절차를 거쳐 지체 없이
            파기합니다.
          </li>
          <li>
            전자적 파일은 복구하기 어려운 방식으로 삭제하고, 출력물이 있는 경우
            분쇄 또는 소각 등 안전한 방법으로 파기합니다.
          </li>
          <li>
            다른 법령에 따라 보관해야 하는 정보는 별도의 저장 공간에 분리하여
            해당 법정 기간 동안만 보관합니다.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="9. 정보주체와 법정대리인의 권리">
        <p>
          이용자 또는 법정대리인은 개인정보의 열람, 정정·삭제, 처리정지, 동의
          철회와 계정 삭제를 요청할 수 있습니다. 요청은
          <a href="mailto:support@dpsteam.kr"> support@dpsteam.kr</a>로 접수할
          수 있으며, 제공자는 본인 또는 정당한 대리인 여부를 확인한 뒤 관련
          법령이 정한 기간과 절차에 따라 처리합니다. 법령상 거절 사유가 있는
          경우 그 사유와 이의 제기 방법을 안내합니다.
        </p>
      </PolicySection>

      <PolicySection title="10. 개인정보의 안전성 확보조치">
        <ul>
          <li>Firebase 인증과 학교 이메일 인증을 통한 접근 통제</li>
          <li>관리자 영역별 비밀번호 및 서명된 세션을 통한 권한 분리</li>
          <li>통신 구간 암호화와 중요 인증정보의 서버 환경 변수 보관</li>
          <li>이메일 인증 코드 해시 처리, 유효기간 및 시도 횟수 제한</li>
          <li>데이터베이스 보안 규칙과 서버 측 권한 검증</li>
        </ul>
      </PolicySection>

      <PolicySection title="11. 개인정보 자동 수집과 쿠키">
        <p>
          서비스는 로그인 상태와 관리자 인증 상태 유지, 보안 및 정상적인 기능
          제공을 위해 쿠키 또는 유사 저장 기술을 사용할 수 있습니다. 이용자는
          브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있으나 로그인 유지
          등 일부 기능이 제한될 수 있습니다. 현재 서비스는 개인정보를 이용한
          맞춤형 광고를 제공하지 않습니다.
        </p>
      </PolicySection>

      <PolicySection title="12. 개인정보 보호 책임 및 문의">
        <div className="policy-note">
          <strong>개인정보 보호 책임 부서</strong>
          <p>DPS Team 서비스 운영팀</p>
          <p>
            이메일: <a href="mailto:support@dpsteam.kr">support@dpsteam.kr</a>
          </p>
        </div>
        <p>
          개인정보 침해에 대한 상담이 필요한 경우 개인정보침해 신고센터(118),
          개인정보 분쟁조정위원회 등 관계 기관에 도움을 요청할 수 있습니다.
        </p>
      </PolicySection>

      <PolicySection title="13. 처리방침의 변경">
        <p>
          본 방침의 내용이 변경되는 경우 시행일 전에 서비스 공지 또는 별도
          화면을 통해 안내합니다. 이용자의 권리에 중대한 영향을 주는 변경은
          충분한 기간을 두고 알리며 필요한 경우 별도의 동의를 받습니다.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
