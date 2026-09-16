import type { Metadata } from "next";
import { PolicyLayout } from "@/components/legal/policy-layout";

export const metadata: Metadata = {
  title: "이용약관 | DongpyeongON",
  description: "DongpyeongON 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <PolicyLayout
      eyebrow="TERMS OF SERVICE"
      title="DongpyeongON 이용약관"
      description="본 약관은 DPS Team이 제공하는 DongpyeongON 서비스의 이용 조건과 이용자 및 서비스 제공자의 권리·의무를 정합니다."
      effectiveDate="2026년 9월 15일"
    >
      <PolicySection title="제1조 (목적)">
        <p>
          이 약관은 DPS Team(이하 “제공자”)이 운영하는 DongpyeongON(이하 “서비스”)의
          이용과 관련하여 제공자와 이용자 사이의 권리, 의무, 책임 및 필요한
          사항을 규정함을 목적으로 합니다.
        </p>
      </PolicySection>

      <PolicySection title="제2조 (용어의 정의)">
        <ol>
          <li>“이용자”란 이 약관에 따라 서비스를 이용하는 사람을 말합니다.</li>
          <li>
            “회원”이란 동평중학교 학교 이메일 계정으로 인증하고 학생 정보를
            등록한 이용자를 말합니다.
          </li>
          <li>
            “게시물”이란 회원이 서비스에 작성하거나 등록한 글, 댓글, 제안,
            신청곡 및 그 밖의 정보를 말합니다.
          </li>
          <li>
            “관리자”란 서비스 운영과 안전한 이용 환경 조성을 위하여 제공자가
            관리 권한을 부여한 사람을 말합니다.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="제3조 (약관의 효력과 변경)">
        <ol>
          <li>
            이 약관은 서비스 화면에 게시하거나 이용자가 확인할 수 있는 방법으로
            공지한 때부터 효력이 발생합니다.
          </li>
          <li>
            제공자는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며,
            중요한 변경은 적용일과 변경 사유를 서비스에서 사전에 안내합니다.
          </li>
          <li>
            이용자에게 불리하거나 중요한 변경은 원칙적으로 적용일 7일 전부터
            안내하며, 법령에서 별도 기간을 정한 경우 그 기간을 따릅니다.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="제4조 (회원가입과 계정 관리)">
        <ol>
          <li>
            회원가입은 <code>@dongpyeong.ms.kr</code>로 끝나는 유효한 학교
            이메일 인증과 필수 학생 정보 입력을 완료해야 합니다.
          </li>
          <li>
            회원은 본인의 계정만 사용해야 하며 비밀번호와 인증 수단을 안전하게
            관리할 책임이 있습니다.
          </li>
          <li>
            만 14세 미만 이용자는 법정대리인의 동의를 받은 경우에만 서비스를
            이용할 수 있습니다.
          </li>
          <li>
            학교 계정 이용 자격을 상실하거나 등록 정보가 사실과 다른 경우 서비스
            이용이 제한될 수 있습니다.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="제5조 (서비스의 내용)">
        <p>제공자는 다음 기능을 제공할 수 있습니다.</p>
        <ul>
          <li>학교 구성원 간 커뮤니티와 학생회 공지</li>
          <li>학교에 의견을 전달하는 동평신문고</li>
          <li>점심시간 노래 검색·신청 및 방송 관리</li>
          <li>계정, 학생 정보, 공지 및 운영에 필요한 부가 기능</li>
        </ul>
        <p>
          일부 기능은 준비, 점검, 학교 운영 상황 또는 외부 서비스의 사정에 따라
          변경되거나 일시 중단될 수 있습니다.
        </p>
      </PolicySection>

      <PolicySection title="제6조 (이용자의 의무)">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul>
          <li>
            타인의 계정이나 개인정보를 도용하거나 허위 정보를 등록하는 행위
          </li>
          <li>
            욕설, 괴롭힘, 차별, 명예훼손 또는 개인정보 침해에 해당하는 행위
          </li>
          <li>
            불법 정보, 음란물, 광고, 도배 또는 학교생활에 부적절한 내용을
            게시하는 행위
          </li>
          <li>
            서비스의 보안이나 정상 작동을 방해하거나 취약점을 악용하는 행위
          </li>
          <li>
            저작권 등 타인의 권리를 침해하거나 관련 법령과 학교 규칙을 위반하는
            행위
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="제7조 (게시물의 권리와 이용)">
        <ol>
          <li>
            회원이 작성한 게시물의 권리는 원칙적으로 해당 회원에게 있습니다.
          </li>
          <li>
            회원은 서비스 제공, 화면 표시, 저장, 백업 및 운영상 필요한 범위에서
            제공자가 게시물을 이용하는 것을 허락합니다. 이 허락은 서비스 운영
            목적에 한정되며 회원의 권리를 부당하게 제한하지 않습니다.
          </li>
          <li>
            회원은 자신이 게시한 내용에 필요한 권리를 보유해야 하며 타인의
            저작물 또는 개인정보를 무단으로 게시해서는 안 됩니다.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="제8조 (게시물 관리와 이용 제한)">
        <ol>
          <li>
            제공자는 신고 접수, 관련 법령, 본 약관 또는 학교 공동체의 안전을
            고려하여 게시물을 숨김·삭제하거나 열람을 제한할 수 있습니다.
          </li>
          <li>
            위반의 정도와 반복성에 따라 경고, 기능 제한, 계정 이용 정지 등의
            조치가 이루어질 수 있습니다.
          </li>
          <li>
            긴급한 안전 문제나 권리 침해가 예상되는 경우 제공자는 사전 통지 없이
            우선 조치하고 이후 가능한 범위에서 사유를 안내할 수 있습니다.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="제9조 (신청곡과 외부 서비스)">
        <ol>
          <li>
            신청곡은 운영 기준에 따라 승인 또는 반려될 수 있으며 신청되었다는
            사실만으로 재생이 보장되지는 않습니다.
          </li>
          <li>
            Spotify 검색과 재생 기능은 Spotify의 정책, 계정 상태, API 제공
            상황에 따라 제한될 수 있습니다.
          </li>
          <li>
            청소년 이용에 부적합하거나 학교에서 재생하기 어려운 음악은 신청 또는
            재생이 제한될 수 있습니다.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="제10조 (서비스 변경과 중단)">
        <p>
          제공자는 유지보수, 장애, 보안 사고 대응, 외부 플랫폼 변경, 학교 운영상
          필요 또는 불가항력으로 서비스를 변경하거나 중단할 수 있습니다. 예측
          가능한 중단은 가능한 범위에서 사전에 안내합니다.
        </p>
      </PolicySection>

      <PolicySection title="제11조 (책임의 제한)">
        <ol>
          <li>
            제공자는 합리적인 범위에서 안정적인 서비스를 제공하기 위해 노력하나,
            천재지변, 통신 장애, 외부 서비스 장애 등 통제하기 어려운 사유로 인한
            중단에 대해서는 고의 또는 중대한 과실이 없는 한 책임을 부담하지
            않습니다.
          </li>
          <li>
            이용자가 작성한 게시물과 이용자 사이의 활동에 대한 책임은 해당
            이용자에게 있습니다. 다만 제공자의 법적 책임이 면제되는 것은
            아닙니다.
          </li>
        </ol>
      </PolicySection>

      <PolicySection title="제12조 (문의와 분쟁 해결)">
        <p>
          서비스 이용 관련 문의는{" "}
          <a href="mailto:support@dpsteam.kr">support@dpsteam.kr</a>로 접수할 수
          있습니다. 제공자와 이용자는 분쟁이 발생한 경우 원만한 해결을 위해
          성실히 협의하며, 해결되지 않는 경우 대한민국 법령과 관할 법원의 절차를
          따릅니다.
        </p>
      </PolicySection>

      <div className="policy-note">
        <strong>서비스 제공자</strong>
        <p>DPS Team · support@dpsteam.kr</p>
      </div>
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
