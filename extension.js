const vscode = require('vscode');

// 진단 결과를 관리하는 컬렉션 변수
let diagnosticCollection;

/**
 * 확장 프로그램 활성화 시 호출
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
	console.log('Accessibility Checker가 활성화되었습니다.');

	// 진단 컬렉션 초기화
	diagnosticCollection = vscode.languages.createDiagnosticCollection('accessibility');
	context.subscriptions.push(diagnosticCollection);

	// 버튼 클릭 시 실행될 커맨드 등록
	const runCheckCommand = vscode.commands.registerCommand('accessibility-checker.runCheck', () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showInformationMessage('검사할 에디터가 없습니다.');
			return;
		}

		// HTML 파일인지 확인
		if (editor.document.languageId !== 'html') {
			vscode.window.showWarningMessage('HTML 파일에서만 작동합니다.');
			return;
		}

		// 검사 로직 실행
		performAccessibilityCheck(editor.document);
	});

	context.subscriptions.push(runCheckCommand);
};

/**
 * 접근성 검사 로직 (정규식 기반 예시)
 */
const performAccessibilityCheck = (document) => {
	const diagnostics = [];
	const text = document.getText();

	// 1. alt 속성이 아예 없거나 빈 값(alt="")인 이미지 감지
	const imgRegex = /<img\b(?![^>]*\balt=["'](?!\s*["'])[^>]*["'])[^>]*>/gi;
	let match;
	while ((match = imgRegex.exec(text)) !== null) {
		const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
		diagnostics.push(new vscode.Diagnostic(
			range,
			'경고: <img> 태그에 유의미한 alt 속성이 없거나 비어 있습니다.',
			vscode.DiagnosticSeverity.Warning
		));
	}

	// 2. input 태그에 연결된 label이 있는지 (간이 검사)
	// id가 없거나 label 태그가 본문에 없는 경우를 체크
	const inputRegex = /<input\b(?![^>]*\bid=["'])[^>]*>|type=["'](text|email|password)["']/gi;
	while ((match = inputRegex.exec(text)) !== null) {
		const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
		diagnostics.push(new vscode.Diagnostic(
			range,
			'권장: <input> 태그에 명확한 id와 연결된 <label>을 제공하세요.',
			vscode.DiagnosticSeverity.Information
		));
	}

	// 3. 부적절한 alt 텍스트 ("이미지", "사진" 등 포함)
	const redundantAltRegex = /alt=["'][^"']*(이미지|사진|icon|img)[^"']*["']/gi;
	while ((match = redundantAltRegex.exec(text)) !== null) {
		const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
		diagnostics.push(new vscode.Diagnostic(
			range,
			'주의: alt 텍스트에 "이미지", "사진" 같은 불필요한 단어가 포함되어 있습니다.',
			vscode.DiagnosticSeverity.Hint
		));
	}

	diagnosticCollection.set(document.uri, diagnostics);
};

/**
 * 확장 프로그램 비활성화 시 호출
 */
const deactivate = () => {
	if (diagnosticCollection) {
		diagnosticCollection.clear();
		diagnosticCollection.dispose();
	}
};

// 모듈 내보내기 (VS Code가 인식할 수 있도록)
module.exports = {
	activate,
	deactivate
};