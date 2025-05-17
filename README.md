# Bíblia: XML + SQL + JSON
Este projeto tem o objetivo de democratizar o acesso à Bíblia Sagrada em português brasileiro a programadores, desenvolvedores e pessoas interessadas em proclamar o Evangelho e as boas-novas do Reino de Deus por meio da tecnologia. Gostou do projeto? Você pode nos ajudar a ir ainda mais longe, basta fazer uma contribuição via PayPal.

[![Doar](https://www.paypalobjects.com/pt_BR/BR/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=A9FM66AQT672L&lc=BR&item_name=Bible%20Sources&currency_code=BRL&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)

## Quais as versões contidas no projeto?
Atualmente o projeto conta com três versões da Bíblia Sagrada em Português Brasileiro (pt-BR):
- Nova Versão Internacional (NVI)
- Almeida Corrigida e Fiel (ACF)
- Almeida Revisada Imprensa Bíblica (AA)

## Quais os formatos de arquivos disponibilizados?
As versões estão disponibilizadas em três formatos:
- XML
- SQL
- JSON

### XML
Há um arquivo XML para cada versão descrita acima. Os arquivos XML estão codificados em UTF-8 e possuem a seguinte estrutura:
```xml
<book>
  <chapter>
    <verse>Texto</verse>
  </chapter>
</book>
```

Há também arquivos mínimos contendo as versões com todos os livros.

### SQL
Há um arquivo SQL para cada versão descrita acima. Os arquivos SQL estão codificados em UTF-8 e possuem a seguinte estrutura:
- Cria a tabela 'testament'
- Cria a tabela 'books'
- Popula as duas tabelas
- Cria a tabela 'verses'
- Popula a tabela com os versículos

A tabela 'verses' está estruturada da seguinte forma:
- id: é o identificador único do versículo
- version: é a versão da Bíblia (NVI, ACF, AA, etc)
- testament: é a identificação do testamento, (1) Velho Testamento ou (2) Novo Testamento
- book: é a identificação do livro da Bília (1-66)
- chapter: é o número do caítulo
- verse: é o número do versículo
- text: é o texto do versículo

### JSON
Há um arquivo JSON para cada versão descrita acima. Os arquivos JSON estão codificados em UTF-8 e possuem a seguinte estrutura:
```javascript
[
	{
	"abbrev" : "abbrev"
	"book" : "name"
	"chapters": 
		[
			["Texto do versículo 1", "Texto do versículo 2", "Texto do versculo 3", "..."],
			["Texto do versículo 1", "Texto do versículo 2", "Texto do versculo 3", "..."],
			["Texto do versículo 1", "Texto do versículo 2", "Texto do versculo 3", "..."]
		]
	}
]
```
Os números dos capítulos e versículos podem ser recuperados pelo índice das arrays.

## Como os arquivos foram montados?
A compilação dos arquivos foi obtida por meio do crawling de páginas web. Sendo assim, é possível, embora pouco provável, que haja pequenos erros de coleta.

## Há também versões em outros idiomas?
Sim, temos versões em muitos outros idiomas. Você pode visualizar acessando nosso projeto [Bible: XML + JSON](https://github.com/thiagobodruk/bible).

## Como funcionam as licenças e direitos?
Este projeto é distribuído sob a licença Creative Commons BY-NC. As traduções bíblicas deste projeto são de autoria e propriedade intelectual da Sociedade Bíblica Internacional (NVI), da Sociedade Bíblica Trinitariana (ACF) e da Imprensa Bíblica Brasileira (AA). Todos os direitos reservados aos autores.

## Como eu posso ajudar?
Ajude-nos a entregar um conteúdo de qualidade, revisando os códigos e montando estruturas otimizadas. Toda ajuda é bem vinda! :)

## Eu posso fazer uma doação para o projeto?
Sim, você pode! Basta fazer uma doação voluntária por meio do [PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=A9FM66AQT672L&lc=BR&item_name=Bible%20Sources&currency_code=BRL&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted).

[![Doar](https://www.paypalobjects.com/pt_BR/BR/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=A9FM66AQT672L&lc=BR&item_name=Bible%20Sources&currency_code=BRL&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)
