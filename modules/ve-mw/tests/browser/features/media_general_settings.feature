@en.wikipedia.beta.wmflabs.org @firefox @internet_explorer_10 @login @safari @test2.wikipedia.org
Feature: VisualEditor Media Interface

  Background:
    Given I go to the "Media Interface VisualEditor Test" page with content "Media Interface VisualEditor Test"
    And I click in the editable part

  Scenario Outline: VisualEditor insert new media
    Given I click Media
    And I enter <search_term> into media Search box
    And I select an Image
    And I click Use this image
    And I fill up the Caption field with "caption"
    And I fill up the Alternative text with "alt text"
    And I click Insert
    And I click Save page
    And I click Review your changes
    Then <expected_markup_text> should appear in the media diff view
    And I can click the X on the media save box
  Examples:
    | search_term           | expected_markup_text                                                                     |
    | duck                  | [[File:Ducks take off 444 720p25.ogg\|alt=alt text\|thumb\|caption]]                     |