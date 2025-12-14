# Firebase Hosting カスタムドメイン設定ガイド

このガイドでは、Manabee Tutor System に独自ドメインを設定する手順を説明します。

## 前提条件

- Firebase プロジェクトにデプロイ済み（現在: `gen-lang-client-0061164735.web.app`）
- 独自ドメインを所有している
- ドメインのDNS設定にアクセスできる

## 手順

### 1. Firebase Console でカスタムドメインを追加

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト **"Manabee"** を選択
3. 左メニューの **「構築」** → **「Hosting」** をクリック
4. **「カスタムドメインを追加」** ボタンをクリック
5. ドメイン名を入力（例: `manabee.example.com` または `example.com`）
6. **「続行」** をクリック

### 2. ドメイン所有権の確認（TXT レコード）

Firebase が TXT レコードを提供します。これをDNSプロバイダーに追加します。

| レコードタイプ | ホスト名 | 値 |
|--------------|---------|-----|
| TXT | `@` または ドメイン名 | Firebase が提供する値 |

**DNS プロバイダー別の設定方法:**
- **お名前.com**: DNS設定 → TXTレコード追加
- **Cloudflare**: DNS → レコード追加
- **Google Domains**: DNS → カスタムレコード

> ⚠️ DNS の反映には最大48時間かかる場合があります

### 3. A レコードの設定

所有権確認後、Firebase が A レコードのIPアドレスを提供します。

| レコードタイプ | ホスト名 | 値 |
|--------------|---------|-----|
| A | `@` | `151.101.1.195` |
| A | `@` | `151.101.65.195` |

> 注: IPアドレスは Firebase が提供する最新の値を使用してください

### 4. サブドメインの場合（CNAME レコード）

`www.example.com` や `app.example.com` などのサブドメインの場合:

| レコードタイプ | ホスト名 | 値 |
|--------------|---------|-----|
| CNAME | `www` または `app` | `ghs.googlehosted.com` |

### 5. SSL 証明書のプロビジョニング

DNS 設定が完了すると、Firebase が自動的に SSL 証明書を発行します。

- 通常は数分〜数時間で完了
- Firebase Console の Hosting セクションでステータスを確認できます

## 設定完了後

カスタムドメインが有効になると:
- `https://your-domain.com` でアプリにアクセス可能
- 自動的に HTTPS が有効化
- 元の `*.web.app` ドメインも引き続き利用可能

## トラブルシューティング

### DNS が反映されない
- 最大48時間待つ
- [WhatsMyDNS](https://whatsmydns.net/) で伝播状況を確認

### SSL 証明書エラー
- TXT レコードが正しく設定されているか確認
- Firebase Console で証明書ステータスを確認

### 「ドメインが見つかりません」エラー
- A レコードの IP アドレスが正しいか確認
- DNS キャッシュをクリア（`sudo dscacheutil -flushcache` on Mac）

## 参考リンク

- [Firebase Hosting ドキュメント](https://firebase.google.com/docs/hosting/custom-domain)
- [カスタムドメインのトラブルシューティング](https://firebase.google.com/support/troubleshooter/hosting/custom-domain)
